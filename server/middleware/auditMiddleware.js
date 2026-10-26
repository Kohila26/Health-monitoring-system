const AuditLog = require('../models/AuditLog');

const logAudit = async ({
  userId,
  userRole = 'patient',
  action,
  resourceType,
  resourceId = null,
  patientAffected = null,
  ipAddress = '127.0.0.1',
  userAgent = '',
  details = {}
}) => {
  try {
    await AuditLog.create({
      performedBy: userId,
      performedByRole: userRole,
      action,
      resourceType,
      resourceId,
      patientAffected,
      ipAddress,
      userAgent,
      details
    });
  } catch (error) {
    console.error('[Audit Log Error]:', error.message);
  }
};

module.exports = { logAudit };
