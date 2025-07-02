import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './components/Homepage/Homepage';
import SignUp from './components/SignUp/SignUp';
import './global.css';

// PUBLIC_INTERFACE
function App() {
  /** Root App for JournalApp frontend with routing */
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/signup" element={<SignUp />} />
      </Routes>
    </Router>
  );
}

export default App;
