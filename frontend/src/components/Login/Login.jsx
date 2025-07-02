import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

// PUBLIC_INTERFACE
function Login() {
  /**
   * Pixel-perfect Login page per assets/login_page_design_notes.md.
   * Centered container with decorative background, main "Daily Journal" heading, 2 fields, button, and navigation link.
   */
  const [form, setForm] = useState({
    username: '',
    password: '',
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Would handle actual login logic here.
    // Stay on page for demo.
  };

  const goToSignup = (e) => {
    e.preventDefault();
    navigate('/signup');
  };

  return (
    <div className={styles.loginRoot}>
      {/* Decorative bottom arc */}
      <div className={styles.bottomArc} />
      <div className={styles.centerWrap}>
        <form className={styles.form} autoComplete="off" onSubmit={handleSubmit}>
          <h1 className={styles.heading}>Daily Journal</h1>
          <input
            className={styles.input}
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            autoComplete="username"
            spellCheck="false"
            required
          />
          <input
            className={styles.input}
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            autoComplete="current-password"
            spellCheck="false"
            required
          />
          <button className={styles.loginButton} type="submit">
            Log In
          </button>
        </form>
        <div className={styles.footer}>
          Don't have an account?{' '}
          <a className={styles.signupLink} href="/signup" onClick={goToSignup}>
            Sign Up
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;
