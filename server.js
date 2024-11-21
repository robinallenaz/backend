require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Kanji = require('./models/Kanji');
const axios = require('axios');

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
      '/api/kanji/:id (GET, PUT, DELETE)',
      '/api/kanji (DELETE)',
      '/api/kanji/random (GET)'
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

// Default kanji set for empty collections
const defaultKanjiSet = [
  { Kanji: "水", Onyomi: "スイ", Kunyomi: "みず", Meaning: "water" },
  { Kanji: "火", Onyomi: "カ", Kunyomi: "ひ", Meaning: "fire" },
  { Kanji: "木", Onyomi: "モク", Kunyomi: "き", Meaning: "tree" },
  { Kanji: "金", Onyomi: "キン", Kunyomi: "かね", Meaning: "gold" },
  { Kanji: "土", Onyomi: "ド", Kunyomi: "つち", Meaning: "earth" },
  { Kanji: "日", Onyomi: "ニチ", Kunyomi: "ひ", Meaning: "sun" },
  { Kanji: "月", Onyomi: "ゲツ", Kunyomi: "つき", Meaning: "moon" },
  { Kanji: "山", Onyomi: "サン", Kunyomi: "やま", Meaning: "mountain" },
  { Kanji: "川", Onyomi: "セン", Kunyomi: "かわ", Meaning: "river" },
  { Kanji: "田", Onyomi: "デン", Kunyomi: "た", Meaning: "rice field" }
];

// GET random kanji
kanjiRouter.get('/random', async (req, res, next) => {
  try {
    console.log('Fetching random kanji with limit:', req.query.limit);
    const limit = parseInt(req.query.limit) || 6;
    
    // Check if there are any kanji in the database
    const count = await Kanji.countDocuments();
    if (count === 0) {
      console.log('No kanji found in database, using default set');
      // Shuffle and slice the default set
      const shuffled = [...defaultKanjiSet].sort(() => 0.5 - Math.random());
      const selectedKanji = shuffled.slice(0, limit);
      return res.json({ 
        kanji: selectedKanji,
        isDefaultSet: true 
      });
    }

    // Get random kanji from user's collection
    const kanjiList = await Kanji.aggregate([
      { $sample: { size: Math.min(limit, count) } }
    ]);

    console.log(`Found ${kanjiList.length} random kanji`);
    res.json({ 
      kanji: kanjiList,
      isDefaultSet: false 
    });
  } catch (error) {
    console.error('Error in GET /random:', error);
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

// DELETE all kanji
kanjiRouter.delete('/', async (req, res, next) => {
  try {
    console.log('Received request to delete all kanji');
    
    // Delete all documents in the Kanji collection
    const result = await Kanji.deleteMany({});
    
    console.log('Deleted Kanji Count:', result.deletedCount);
    
    res.json({ 
      message: 'All kanji deleted successfully', 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('Error in DELETE /api/kanji:', error);
    next(error);
  }
});

// Mount the router
app.use('/api/kanji', kanjiRouter);

// Dictionary proxy endpoint
app.get('/api/dictionary/search', async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: 'Query parameter is required' });
    }

    const response = await axios.get(`https://jisho.org/api/v1/search/words?keyword=${encodeURIComponent(query)}`);
    res.json(response.data);
  } catch (error) {
    next(error);
  }
});

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
