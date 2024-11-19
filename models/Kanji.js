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
});

module.exports = mongoose.model('Kanji', kanjiSchema);
