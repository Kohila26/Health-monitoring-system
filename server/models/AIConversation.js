const mongoose = require('mongoose');

const aiConversationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      default: 'Health Consultation Chat'
    },
    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant', 'system'],
          required: true
        },
        content: {
          type: String,
          required: true
        },
        timestamp: {
          type: Date,
          default: Date.now
        },
        contextMetadata: {
          vitalsReferenced: [String],
          alertTriggered: Boolean
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('AIConversation', aiConversationSchema);
