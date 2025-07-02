import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Homepage from './components/Homepage/Homepage';
import SignUp from './components/SignUp/SignUp';
import Login from './components/Login/Login';
import CalendarPage from './components/Calendar/CalendarPage';
import './global.css';

// PUBLIC_INTERFACE
function App() {
  /**
   * Root App for JournalApp frontend with routing.
   * Post-login (simulated) landing is /calendar. '/' also loads calendar for this release.
   */
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CalendarPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        {/* Optionally, keep homepage at /home */}
        <Route path="/home" element={<Homepage />} />
      </Routes>
    </Router>
  );
}

export default App;
