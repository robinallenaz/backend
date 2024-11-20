require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Kanji = require('./models/Kanji');

const app = express();

// Error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error in request:', {
    message: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    body: req.body
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(err.errors).map(error => error.message)
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    return res.status(409).json({
      message: 'Duplicate key error',
      duplicateField: Object.keys(err.keyPattern)[0]
    });
  }

  // Default error response
  res.status(500).json({ 
    message: 'Internal Server Error', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Add connection event listeners
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('Mongoose disconnected from MongoDB');
});

// Create a router for kanji routes
const kanjiRouter = express.Router();

// Root route for debugging
app.get('/', (req, res) => {
  res.json({ 
    message: 'Kanji API is running', 
    status: 'OK',
    endpoints: [
      '/api/kanji (GET, POST)',
      '/api/kanji/:id (GET, PUT, DELETE)'
    ]
  });
});

// GET all kanji
kanjiRouter.get('/', async (req, res, next) => {
  try {
    console.log('Received request to fetch all kanji');
    const kanjiList = await Kanji.find();
    
    console.log('Fetched Kanji List:', kanjiList);
    
    // Ensure we're sending an array
    if (!Array.isArray(kanjiList)) {
      console.error('Unexpected data type:', typeof kanjiList);
      return res.status(500).json({ message: 'Internal server error: Invalid data type' });
    }
    
    res.json(kanjiList);
  } catch (error) {
    console.error('Error in GET /api/kanji:', error);
    next(error);
  }
});

// GET single kanji by ID
kanjiRouter.get('/:id', async (req, res, next) => {
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

// POST create new kanji
kanjiRouter.post('/', async (req, res, next) => {
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
kanjiRouter.put('/:id', async (req, res, next) => {
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
kanjiRouter.delete('/:id', async (req, res, next) => {
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

// Mount the router
app.use('/api/kanji', kanjiRouter);

// Use error handling middleware
app.use(errorHandler);

// Improved error handling for server startup
const startServer = async () => {
  try {
    // Ensure MongoDB connection
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB successfully');

    // Start Express server
    const PORT = process.env.PORT || 5001;
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`Access at: http://localhost:${PORT}`);
    });

    // Handle server errors
    server.on('error', (err) => {
      console.error('Server startup error:', err);
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Please kill the process or use a different port.`);
        process.exit(1);
      }
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('Received SIGINT. Shutting down gracefully...');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('MongoDB connection closed.');
          process.exit(0);
        });
      });
    });

  } catch (err) {
    console.error('❌ Failed to start server:', {
      message: err.message,
      name: err.name,
      code: err.code,
      stack: err.stack
    });
    process.exit(1);
  }
};

// Call the startup function
startServer();
