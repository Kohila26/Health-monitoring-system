const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const DoctorProfile = require('../models/DoctorProfile');
const jwt = require('jsonwebtoken');
const { logAudit } = require('../middleware/auditMiddleware');

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET || 'health_monitoring_super_secret_jwt_key_2026',
    { expiresIn: '30d' }
  );
};

// @desc Register a new user
// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role = 'patient', phone, ...profileData } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    // Default verification: Patients & Admin are verified; Doctors require verification by Admin (auto-verified if demo doctor)
    const isDoctor = role === 'doctor';
    const isVerified = !isDoctor; // doctors pending verification

    const user = await User.create({
      name,
      email,
      password,
      role,
      phone,
      isVerified
    });

    // Create appropriate role profile
    if (role === 'patient') {
      await PatientProfile.create({
        user: user._id,
        gender: profileData.gender || 'prefer_not_to_say',
        dateOfBirth: profileData.dateOfBirth,
        bloodGroup: profileData.bloodGroup || 'unknown',
        height: profileData.height,
        weight: profileData.weight,
        emergencyContact: profileData.emergencyContact || { name: '', relation: '', phone: '' }
      });
    } else if (role === 'doctor') {
      await DoctorProfile.create({
        user: user._id,
        licenseNumber: profileData.licenseNumber || `MD-${Date.now().toString().slice(-6)}`,
        specialization: profileData.specialization || 'General Physician',
        hospitalOrClinic: profileData.hospitalOrClinic || 'Community Health Clinic',
        yearsOfExperience: profileData.yearsOfExperience || 3,
        bio: profileData.bio || 'Dedicated medical professional.'
      });
    }

    const token = generateToken(user._id);

    await logAudit({
      userId: user._id,
      userRole: user.role,
      action: 'USER_REGISTERED',
      resourceType: 'User',
      resourceId: user._id,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('[Auth Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Authenticate user & get token
// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide both email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'This account has been deactivated' });
    }

    // Update lastLogin
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);

    await logAudit({
      userId: user._id,
      userRole: user.role,
      action: 'USER_LOGIN',
      resourceType: 'User',
      resourceId: user._id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error('[Login Error]:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Logout user (client-side discard + audit)
// @route POST /api/auth/logout
exports.logout = async (req, res) => {
  if (req.user) {
    await logAudit({
      userId: req.user._id,
      userRole: req.user.role,
      action: 'USER_LOGOUT',
      resourceType: 'User',
      resourceId: req.user._id,
      ipAddress: req.ip
    });
  }
  res.json({ success: true, message: 'Logged out successfully' });
};

// @desc Get current authenticated user details
// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let profile = null;

    if (user.role === 'patient') {
      profile = await PatientProfile.findOne({ user: user._id });
    } else if (user.role === 'doctor') {
      profile = await DoctorProfile.findOne({ user: user._id });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      },
      profile
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc Update user profile details
// @route PUT /api/auth/profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar, ...profileFields } = req.body;

    const user = await User.findById(req.user.id);
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;
    await user.save();

    let updatedProfile = null;
    if (user.role === 'patient') {
      updatedProfile = await PatientProfile.findOneAndUpdate(
        { user: user._id },
        { $set: profileFields },
        { new: true, upsert: true }
      );
    } else if (user.role === 'doctor') {
      updatedProfile = await DoctorProfile.findOneAndUpdate(
        { user: user._id },
        { $set: profileFields },
        { new: true, upsert: true }
      );
    }

    await logAudit({
      userId: user._id,
      userRole: user.role,
      action: 'PROFILE_UPDATED',
      resourceType: 'Profile',
      resourceId: user._id,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar
      },
      profile: updatedProfile
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
