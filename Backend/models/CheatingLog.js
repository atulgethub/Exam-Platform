const mongoose = require('mongoose');

const cheatingLogSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  violationType: {
    type: String,
    enum: ['tab_switch', 'keyboard_shortcut', 'right_click', 'copy_paste', 'fullscreen_exit', 'devtools_open'],
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CheatingLog', cheatingLogSchema);