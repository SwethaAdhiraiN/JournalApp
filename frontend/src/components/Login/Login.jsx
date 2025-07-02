import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';

// PUBLIC_INTERFACE
function Login() {
  /**
   * Pixel-perfect Login page per assets/login_page_design_notes.md.
   * Centered container with decorative background, main "Daily Journal" heading, 2 fields, button, and navigation link.
   * Handles POST to /login and shows user feedback. Feedback appears as styled notification/banner at top.
   */

  const [form, setForm] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [banner, setBanner] = useState({
    message: '',
    type: '', // 'success' | 'error'
    visible: false,
  });

  const bannerTimeout = useRef(null);
  const navigate = useNavigate();

  // Show notification banner. (type: 'success' | 'error')
  function showBanner(message, type = 'error', duration = 3200) {
    // Always clear any ongoing timeout.
    if (bannerTimeout.current) {
      clearTimeout(bannerTimeout.current);
    }
    setBanner({ message, type, visible: true });
    if (duration > 0) {
      bannerTimeout.current = setTimeout(() => {
        setBanner(b => ({ ...b, visible: false, message: '', type: '' }));
      }, duration);
    }
  }

  // Whenever user changes username/password, immediately clear the notification.
  useEffect(() => {
    // Not on initial mount, only on field actual change.
    if (banner.visible) {
      setBanner(b => ({ ...b, visible: false, message: '', type: '' }));
      if (bannerTimeout.current) clearTimeout(bannerTimeout.current);
    }
    // eslint-disable-next-line
  }, [form.username, form.password]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (bannerTimeout.current) clearTimeout(bannerTimeout.current);
    };
  }, []);

  // PUBLIC_INTERFACE: Handle login form submission and POST to backend
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic empty field client-side check
    if (!form.username || !form.password) {
      showBanner('Please enter both username and password.', 'error', 3200);
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
        showBanner(data?.detail ? data.detail : 'Login failed.', 'error', 3800);
        setLoading(false);
        return;
      }

      // Success: backend returns { message: "Login Successful" }
      if (form.username) {
        localStorage.setItem("journalapp-username", form.username);
      }
      showBanner(data.message || 'Login Successful', 'success', 900);
      setLoading(false);

      // Redirect to /calendar after short delay
      setTimeout(() => navigate("/calendar"), 950);
    } catch (err) {
      showBanner('Could not connect to server.', 'error', 3800);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    // Notification banner auto-clears on input change via effect.
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
        {/* Banner notification at top of form – always positioned above */}
        {banner.visible && banner.message && (
          <div
            className={`${styles.banner} ${banner.type === 'success' ? styles.bannerSuccess : styles.bannerError}`}
            role={banner.type === 'success' ? "status" : "alert"}
            aria-live="polite"
            data-testid="login-notification"
          >
            {banner.message}
          </div>
        )}
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
            aria-invalid={banner.visible && banner.type === 'error' ? "true" : undefined}
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
            aria-invalid={banner.visible && banner.type === 'error' ? "true" : undefined}
          />
          <button
            className={styles.loginButton}
            type="submit"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Logging In..." : "Log In"}
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
