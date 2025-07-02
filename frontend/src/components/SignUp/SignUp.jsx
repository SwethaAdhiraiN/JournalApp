import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SignUp.module.css';
import { API_BASE_URL } from '../../config';

// PUBLIC_INTERFACE
function SignUp() {
  /**
   * Pixel-perfect Sign Up page using CSS Modules for all styling.
   * Uses POST to /signup and client validation, with feedback banner.
   */
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState({
    message: '',
    type: '',
    visible: false,
  });
  const [loading, setLoading] = useState(false);
  const bannerTimeout = useRef(null);
  const navigate = useNavigate();

  function validateFields({ username, password, confirmPassword }) {
    const errs = {};
    if (!username || username.length < 3) {
      errs.username = 'Username must be at least 3 characters';
    } else if (username.length > 32) {
      errs.username = 'Username must be 32 characters or less';
    } else if (!/^[a-zA-Z0-9_\-]+$/.test(username)) {
      errs.username = 'Username must use only letters, numbers, "_" or "-"';
    }
    if (!password || password.length < 5) {
      errs.password = 'Password must be at least 5 characters';
    } else if (password.length > 128) {
      errs.password = 'Password must be 128 characters or less';
    }
    if (confirmPassword !== password) {
      errs.confirmPassword = 'Passwords do not match';
    }
    return errs;
  }

  function showBanner(message, type = 'error', duration = 3200) {
    if (bannerTimeout.current) clearTimeout(bannerTimeout.current);
    setBanner({ message, type, visible: true });
    if (duration > 0) {
      bannerTimeout.current = setTimeout(() => {
        setBanner(b => ({ ...b, visible: false, message: '', type: '' }));
      }, duration);
    }
  }

  useEffect(() => {
    if (banner.visible) {
      setBanner(b => ({ ...b, visible: false, message: '', type: '' }));
      if (bannerTimeout.current) clearTimeout(bannerTimeout.current);
    }
    // eslint-disable-next-line
  }, [form.username, form.password, form.confirmPassword]);

  useEffect(() => {
    return () => {
      if (bannerTimeout.current) clearTimeout(bannerTimeout.current);
    };
  }, []);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const foundErrors = validateFields(form);
    if (Object.keys(foundErrors).length > 0) {
      setErrors(foundErrors);
      if (foundErrors.username) {
        showBanner(foundErrors.username, 'error', 3200);
      } else if (foundErrors.password) {
        showBanner(foundErrors.password, 'error', 3200);
      } else if (foundErrors.confirmPassword) {
        showBanner(foundErrors.confirmPassword, 'error', 3200);
      }
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) {
        showBanner(typeof data.detail === 'string' ? data.detail : 'Signup failed.', 'error', 3600);
        setLoading(false);
        return;
      }
      setErrors({});
      showBanner('Signup successful: User details added to users.json', 'success', 1600);
      setLoading(false);
      setTimeout(() => { navigate('/login'); }, 1100);
    } catch (err) {
      showBanner('Could not connect to server. Please try again.', 'error', 3600);
      setLoading(false);
    }
  };

  const goToLogin = (e) => {
    e.preventDefault();
    navigate('/login');
  };

  return (
    <div className={styles.signUpRoot}>
      <div className={styles.bottomCurve}/>
      <div className={styles.centerWrap}>
        {banner.visible && banner.message && (
          <div
            className={`${styles.banner} ${banner.type === 'success' ? styles.bannerSuccess : styles.bannerError}`}
            role={banner.type === 'success' ? 'status' : 'alert'}
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
            <div id="signup-username-error" className={styles.error}>
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
            <div id="signup-password-error" className={styles.error}>
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
            <div id="signup-confirm-error" className={styles.error}>
              {errors.confirmPassword}
            </div>
          )}
          <button
            className={styles.button}
            type="submit"
            disabled={loading}
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
        <div className={styles.footer}>
          Already have an account?{' '}
          <a
            className={styles.loginLink}
            href="/login"
            onClick={goToLogin}
            tabIndex={0}
          >
            Log In
          </a>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
