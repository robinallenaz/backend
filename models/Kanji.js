const mongoose = require('mongoose');

const kanjiSchema = new mongoose.Schema({
  Kanji: {
    type: String,
    required: true,
    unique: true
  },
  Onyomi: {
    type: String,
    default: ''
  },
  Kunyomi: {
    type: String,
    default: ''
  },
  Meaning: {
    type: String,
    default: ''
  }
}, { 
  // Add timestamps option to automatically add createdAt and updatedAt fields
  timestamps: true 
});

module.exports = mongoose.model('Kanji', kanjiSchema);
