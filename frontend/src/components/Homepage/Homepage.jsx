import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Homepage.module.css';

// PUBLIC_INTERFACE
function Homepage() {
  /** Homepage for Journal App. Pixel-perfect as per 'assets/homepage_design_notes.md'. */
  const navigate = useNavigate();

  const handleSignup = () => {
    // PUBLIC_INTERFACE: Navigate to Sign Up page
    navigate('/signup');
  };

  const handleLogin = () => {
    // PUBLIC_INTERFACE: Navigate to Login page
    navigate('/login');
  };

  return (
    <div className={styles.homeRoot}>
      {/* Decorative Layered Backgrounds */}
      <div className={styles.topBg} />
      <div className={styles.arcBg} />
      <div className={styles.bottomBg} />

      <main className={styles.mainContent}>
        <span className={styles.welcome}>Welcome to</span>
        <h1 className={styles.heading}>Daily Journal</h1>
        <div className={styles.subheading}>Track your day and your mood</div>
        <div className={styles.buttonRow}>
          <button className={styles.loginButton} type="button" onClick={handleLogin}>
            Log In
          </button>
          <button className={styles.signupButton} type="button" onClick={handleSignup}>
            Sign Up
          </button>
        </div>
      </main>
    </div>
  );
}

export default Homepage;
