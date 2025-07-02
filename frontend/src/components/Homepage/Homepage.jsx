import React from 'react';
import styles from './Homepage.module.css';

// PUBLIC_INTERFACE
function Homepage() {
  /** Homepage for Journal App, pixel-perfect as per provided design notes and image. */
  return (
    <div className={styles.homeRoot}>
      <div className={styles.topBg} />
      <div className={styles.arcBg} />
      <div className={styles.bottomBg} />

      <main className={styles.mainContent}>
        <span className={styles.welcome}>Welcome to</span>
        <h1 className={styles.heading}>Daily Journal</h1>
        <div className={styles.subheading}>Track your day and your mood</div>
        <div className={styles.buttonRow}>
          <button className={styles.loginButton} type="button">
            Log In
          </button>
          <button className={styles.signupButton} type="button">
            Sign Up
          </button>
        </div>
      </main>
    </div>
  );
}

export default Homepage;
