import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Homepage from './components/Homepage/Homepage';
import SignUp from './components/SignUp/SignUp';
import Login from './components/Login/Login';
import CalendarPage from './components/Calendar/CalendarPage';
import './global.css';

/**
 * PUBLIC_INTERFACE
 * isAuthenticated checks whether a user is currently logged in.
 *
 * Usage:
 *   - This function is used to determine if the user session (authenticated state)
 *     exists in the browser. It is typically called to gate access to protected routes.
 *
 * Returns:
 *   - Boolean: true if the 'journalapp-username' key exists in localStorage (user is logged in),
 *              false otherwise.
 *
 * Parameters: None
 */
function isAuthenticated() {
  return Boolean(localStorage.getItem('journalapp-username'));
}

/**
 * ProtectedRoute: wrapper to protect private pages (Calendar),
 * redirects to /login if user not logged in.
 */
function ProtectedRoute({ children }) {
  const location = useLocation();
  if (!isAuthenticated()) {
    // redirect to login, but remember target (optional: location.state)
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

// PUBLIC_INTERFACE
function App() {
  /**
   * Root App for JournalApp frontend with protected Calendar route.
   * Home is the landing page (/). Calendar is now private.
   */
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/home" element={<Homepage />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <CalendarPage />
            </ProtectedRoute>
          }
        />
        {/* Route fallback: unmatched routes go to Home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
