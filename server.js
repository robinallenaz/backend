require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Kanji = require('./models/Kanji');

const app = express();

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
};

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection with better error handling
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Add connection error handler
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err);
});

// CRUD Routes

// GET all kanji
app.get('/api/kanji', async (req, res, next) => {
  try {
    const kanjiList = await Kanji.find();
    res.json(kanjiList);
  } catch (error) {
    next(error);
  }
});

// GET single kanji by ID
app.get('/api/kanji/:id', async (req, res, next) => {
  try {
    const kanji = await Kanji.findById(req.params.id);
    if (!kanji) {
      return res.status(404).json({ message: 'Kanji not found' });
    }
    res.json(kanji);
  } catch (error) {
    next(error);
  }
});

// POST new kanji
app.post('/api/kanji', async (req, res, next) => {
  try {
    const kanji = new Kanji({
      Kanji: req.body.Kanji,
      Onyomi: req.body.Onyomi,
      Kunyomi: req.body.Kunyomi,
      Meaning: req.body.Meaning
    });
    const newKanji = await kanji.save();
    res.status(201).json(newKanji);
  } catch (error) {
    next(error);
  }
});

// PUT update kanji
app.put('/api/kanji/:id', async (req, res, next) => {
  try {
    const kanji = await Kanji.findById(req.params.id);
    if (!kanji) {
      return res.status(404).json({ message: 'Kanji not found' });
    }
    Object.assign(kanji, req.body);
    const updatedKanji = await kanji.save();
    res.json(updatedKanji);
  } catch (error) {
    next(error);
  }
});

// DELETE kanji
app.delete('/api/kanji/:id', async (req, res, next) => {
  try {
    const kanji = await Kanji.findById(req.params.id);
    if (!kanji) {
      return res.status(404).json({ message: 'Kanji not found' });
    }
    await kanji.deleteOne();
    res.json({ message: 'Kanji deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Use error handling middleware
app.use(errorHandler);

// Start server with error handling
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Please try a different port.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});
