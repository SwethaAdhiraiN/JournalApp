import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SignUp.module.css';

// PUBLIC_INTERFACE
function SignUp() {
  /**
   * Sign Up page for JournalApp.
   * Implements client-side field validation, API call to /signup,
   * styled notification banner for success/errors, and navigation on success.
   */
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState({
    message: '',
    type: '', // 'success' | 'error'
    visible: false,
  });
  const [loading, setLoading] = useState(false);

  const bannerTimeout = useRef(null);
  const navigate = useNavigate();

  // Validation logic
  function validateFields({ username, password, confirmPassword }) {
    const errs = {};
    // Username: min 3, max 32, chars only (allow _ or -)
    if (!username || username.length < 3) {
      errs.username = 'Username must be at least 3 characters';
    } else if (username.length > 32) {
      errs.username = 'Username must be 32 characters or less';
    } else if (!/^[a-zA-Z0-9_\-]+$/.test(username)) {
      errs.username = 'Username must use only letters, numbers, "_" or "-"';
    }

    // Password: 5-128 chars
    if (!password || password.length < 5) {
      errs.password = 'Password must be at least 5 characters';
    } else if (password.length > 128) {
      errs.password = 'Password must be 128 characters or less';
    }

    // Confirm password: must match
    if (confirmPassword !== password) {
      errs.confirmPassword = 'Passwords do not match';
    }
    return errs;
  }

  // Banner notification logic
  function showBanner(message, type = 'error', duration = 3300) {
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

  // Effect: Whenever a user edits any field, clear the banner.
  useEffect(() => {
    // Not on initial mount, only on actual field change.
    if (banner.visible) {
      setBanner(b => ({ ...b, visible: false, message: '', type: '' }));
      if (bannerTimeout.current) clearTimeout(bannerTimeout.current);
    }
    // eslint-disable-next-line
  }, [form.username, form.password, form.confirmPassword]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (bannerTimeout.current) clearTimeout(bannerTimeout.current);
    };
  }, []);

  // Handle form field changes
  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors({});
    // Notification banner auto-clears on input change via effect.
  };

  // PUBLIC_INTERFACE: Handle Submit Sign Up
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Client validation
    const foundErrors = validateFields(form);
    if (Object.keys(foundErrors).length > 0) {
      setErrors(foundErrors);
      // Show only the highest-priority error as a banner for visibility
      if (foundErrors.username) {
        showBanner(foundErrors.username, 'error', 3500);
      } else if (foundErrors.password) {
        showBanner(foundErrors.password, 'error', 3500);
      } else if (foundErrors.confirmPassword) {
        showBanner(foundErrors.confirmPassword, 'error', 3500);
      }
      return;
    }

    setLoading(true);
    try {
      // Backend call
      const response = await fetch('http://localhost:8000/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      const data = await response.json();

      if (!response.ok) {
        // Backend error (400, 409, etc): always show banner with backend's detail
        showBanner(typeof data.detail === 'string' ? data.detail : 'Signup failed.', 'error', 4000);
        setLoading(false);
        return;
      }

      // Success! Show success notification and brief delay before redirect
      setErrors({});
      showBanner('Signup successful: User details added to users.json', 'success', 2200);
      setLoading(false);
      setTimeout(() => {
        navigate('/login');
      }, 1200); // Wait for notification before redirecting
    } catch (err) {
      showBanner('Could not connect to server. Please try again.', 'error', 4000);
      setLoading(false);
    }
  };

  // PUBLIC_INTERFACE: Navigate to login
  const goToLogin = (e) => {
    e.preventDefault();
    navigate('/login');
  };

  return (
    <div className={styles.signupRoot}>
      {/* BG: Main color and arc curve */}
      <div className={styles.bottomCurve} />
      <div className={styles.centerWrap}>
        {/* Banner notification at top of form – always positioned above */}
        {banner.visible && banner.message && (
          <div
            className={
              styles.banner + ' ' +
              (banner.type === 'success'
                ? styles.bannerSuccess
                : styles.bannerError)
            }
            role={banner.type === 'success' ? "status" : "alert"}
            aria-live="polite"
            data-testid="signup-notification"
          >
            {banner.message}
          </div>
        )}
        <form className={styles.form} autoComplete="off" onSubmit={handleSubmit} noValidate>
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
            aria-invalid={!!errors.username}
            aria-describedby={errors.username ? 'signup-username-error' : undefined}
          />
          {errors.username && (
            <div id="signup-username-error" style={{ color: '#c03528', fontSize: '0.93em', marginBottom: "0.5rem", textAlign: 'left', width: '100%' }}>
              {errors.username}
            </div>
          )}

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
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'signup-password-error' : undefined}
          />
          {errors.password && (
            <div id="signup-password-error" style={{ color: '#c03528', fontSize: '0.93em', marginBottom: "0.5rem", textAlign: 'left', width: '100%' }}>
              {errors.password}
            </div>
          )}

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
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? 'signup-confirm-error' : undefined}
          />
          {errors.confirmPassword && (
            <div id="signup-confirm-error" style={{ color: '#c03528', fontSize: '0.93em', marginBottom: "0.5rem", textAlign: 'left', width: '100%' }}>
              {errors.confirmPassword}
            </div>
          )}

          <button className={styles.signupButton} type="submit" disabled={loading}>
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
        <div className={styles.footer}>
          Already have an account?{' '}
          <a className={styles.loginLink} href="/login" onClick={goToLogin}>
            Log In
          </a>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
