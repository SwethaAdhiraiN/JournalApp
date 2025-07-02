import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SignUp.module.css';

// PUBLIC_INTERFACE
function SignUp() {
  /**
   * Sign Up page for JournalApp.
   * Implements client-side field validation, API call to /signup,
   * error/success handling, and navigation on success.
   */
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Simple validation logic
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

  // Handle form field changes
  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors({});
    setApiError('');
  };

  // PUBLIC_INTERFACE: Handle Submit Sign Up
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    
    // Client validation
    const foundErrors = validateFields(form);
    if (Object.keys(foundErrors).length > 0) {
      setErrors(foundErrors);
      return;
    }

    setLoading(true);
    try {
      // Assume backend runs locally (adjust origin as needed)
      const response = await fetch('http://localhost:8000/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      if (!response.ok) {
        const data = await response.json();
        setApiError(typeof data.detail === 'string' ? data.detail : 'Signup failed.');
        setLoading(false);
        return;
      }

      // Success! Show success message briefly, then navigate to login
      setLoading(false);
      setApiError('');
      setErrors({});
      // Optionally show toast/snackbar here
      setTimeout(() => {
        navigate('/login');
      }, 500); // slight delay for UX
    } catch (err) {
      setApiError('Could not connect to server. Please try again.');
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

          {apiError && (
            <div style={{ color: '#c03528', fontSize: '1em', marginBottom: "0.5rem", textAlign: 'center', width: '100%' }}>
              {apiError}
            </div>
          )}
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
