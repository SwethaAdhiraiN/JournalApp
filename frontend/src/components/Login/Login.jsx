import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

// PUBLIC_INTERFACE
function Login() {
  /**
   * Pixel-perfect Login page per assets/login_page_design_notes.md.
   * Centered container with decorative background, main "Daily Journal" heading, 2 fields, button, and navigation link.
   * Handles POST to /login and shows user feedback.
   */

  const [form, setForm] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [apiMsg, setApiMsg] = useState('');    // Both for errors and 'Login Successful'
  const [isSuccess, setIsSuccess] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setApiMsg('');
    setIsSuccess(false);
  };

  // PUBLIC_INTERFACE: Handle login form submission and POST to backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiMsg('');
    setIsSuccess(false);

    // Basic empty field client-side check
    if (!form.username || !form.password) {
      setApiMsg('Please enter both username and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle error from backend (401 or others)
        setApiMsg(data?.detail ? data.detail : 'Login failed.');
        setIsSuccess(false);
        setLoading(false);
        return;
      }

      // Success: backend returns { message: "Login Successful" }
      setApiMsg(data.message || 'Login Successful');
      setIsSuccess(true);
      setLoading(false);

      // Optionally redirect or clear form – for demo, just show message
      // setTimeout(() => navigate("/"), 1000); // Could redirect after brief time
    } catch (err) {
      setApiMsg('Could not connect to server.');
      setIsSuccess(false);
      setLoading(false);
    }
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
            aria-invalid={!!apiMsg && !isSuccess}
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
            aria-invalid={!!apiMsg && !isSuccess}
          />
          <button
            className={styles.loginButton}
            type="submit"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Logging In..." : "Log In"}
          </button>
          {apiMsg && (
            <div
              style={{
                color: isSuccess ? "#13795a" : "#c03528",
                fontSize: "1em",
                marginBottom: "0.6rem",
                marginTop: "-0.3rem",
                textAlign: "center",
                width: "100%"
              }}
              role={isSuccess ? "status" : "alert"}
              aria-live="polite"
            >
              {apiMsg}
            </div>
          )}
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
