import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SignUp.module.css';

// PUBLIC_INTERFACE
function SignUp() {
  /**
   * Sign Up page for JournalApp.
   * Pixel-perfect implementation according to assets/signup_design_notes.md and style_guide.md.
   * 3 fields (Username, Password, Confirm Password), curved backgrounds,
   * button, and a login link styled/behaviors per extracted design spec.
   */
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // PUBLIC_INTERFACE: Would handle real sign-up logic here.
    // For now, stay on page.
    // Optionally validate or give feedback.
  };

  const goToLogin = (e) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <div className={styles.signupRoot}>
      {/* BG: Main color and arc curve */}
      <div className={styles.bottomCurve} />
      <div className={styles.centerWrap}>
        <form className={styles.form} autoComplete="off" onSubmit={handleSubmit}>
          <h2 className={styles.heading}>Sign Up</h2>
          <input
            className={styles.input}
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            autoComplete="username"
            required
            spellCheck="false"
          />
          <input
            className={styles.input}
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            required
            spellCheck="false"
          />
          <input
            className={styles.input}
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            required
            spellCheck="false"
          />
          <button className={styles.signupButton} type="submit">
            Sign Up
          </button>
        </form>
        <div className={styles.footer}>
          Already have an account?{' '}
          <a className={styles.loginLink} href="/" onClick={goToLogin}>
            Log In
          </a>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
