// models/sessionModel.js
const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  uniqueId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  name: { 
    type: String, 
    required: true 
  },
  spaces: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Space' 
  }],
  lastActive: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Session = mongoose.model('Session', sessionSchema);
module.exports = Session;