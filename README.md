# Kanji Learning Web Application

An interactive full-stack web application designed to help users study Japanese Kanji characters through creating custom kanji sets which they can review on their Collection page, or play matching games with on the Practice page. It also includes a Dictionary page that provides dictionary lookup through the KanjiAPI.

If users do not wish to create a custom kanji set, a default set of kanji is provided for practice.

## Features

### 1. Practice Mode
- Interactive card-based learning system
- Memory game with kanji-meaning matching
- Immediate feedback on correct/incorrect matches
- Progress tracking and scoring

### 2. Kanji Dictionary
- Kanji lookup functionality
- Detailed information for each character including:
  - Meanings
  - Readings
  - Example usage
  - Stroke order

### 3. User Interface
- Clean, modern design
- Responsive layout for desktop and mobile devices
- Intuitive navigation

## Technology Stack

### Frontend
- React (Vite)
- React Router for navigation
- Axios for API communication

### Backend
- Node.js
- Express.js
- Custom API endpoints
- Integration with KanjiAPI (https://kanjiapi.dev/)

## Project Structure

```
capstone_fullstack_app/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   └── index.html
└── backend/
    ├── routes/
    ├── models/
    └── server.js
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd frontend
   npm install
   ```

3. Start the development servers:
   ```bash
   # Start backend server
   cd backend
   npm start

   # Start frontend development server
   cd frontend
   npm run dev
   ```

## Features in Detail

### Practice Mode
The practice mode offers an engaging way to learn kanji through a memory card game:

- Cards display kanji characters and their meanings
- Users match pairs of cards
- Animations provide feedback on correct/incorrect matches
- Progress is tracked throughout the session

### Dictionary Mode
The dictionary feature provides information about kanji characters:

- Kanji meaning
- Kanji readings
- Stroke order

## Contributing

This project is part of a capstone learning experience. Contributions, suggestions, and feedback are welcome!
