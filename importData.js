require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs').promises;
const Kanji = require('./models/Kanji');

async function importData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Read JSON file
    const jsonData = await fs.readFile('./capstone.kanji.json', 'utf8');
    const kanjiData = JSON.parse(jsonData);

    // Transform the data to remove MongoDB specific _id format
    const transformedData = kanjiData.map(item => ({
      Kanji: item.Kanji,
      Onyomi: item.Onyomi,
      Kunyomi: item.Kunyomi,
      Meaning: item.Meaning
    }));

    // Clear existing data
    await Kanji.deleteMany({});
    console.log('Cleared existing data');

    // Import new data
    await Kanji.insertMany(transformedData);
    console.log('Data imported successfully!');

    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error importing data:', error);
    process.exit(1);
  }
}

importData();
