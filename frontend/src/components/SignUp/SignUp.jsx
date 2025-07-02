import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function SignUp() {
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
      // Use centralized API base URL from config.js
      // Use relative path if proxy is set in package.json, else fall back to configured full URL
      let signupUrl = '';
      try {
        // Dynamic import for Vite/CRA support
        // eslint-disable-next-line
        signupUrl = require('../../config').API_BASE_URL + '/signup';
      } catch(e) {
        // fallback for custom builds
        signupUrl = 'http://localhost:8000/signup';
      }
      const response = await fetch(`${signupUrl}`, {
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

  const rootStyle = {
    minHeight: '100vh',
    width: '100vw',
    background: 'var(--bg-main)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    fontFamily: 'Helvetica Neue, Arial, sans-serif'
  };

  const bottomCurveStyle = {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: '100vw',
    height: '29vh',
    background: 'var(--bg-curve)',
    borderTopLeftRadius: '80vw 15vh',
    borderTopRightRadius: '80vw 15vh',
    zIndex: 0,
    boxShadow: '0 -2px 20px 0 rgba(20,200,183,0.04)',
    pointerEvents: 'none'
  };

  const centerWrapStyle = {
    position: 'relative',
    width: '100vw',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2
  };

  const bannerBaseStyle = {
    display: 'block',
    width: '100%',
    maxWidth: 350,
    boxSizing: 'border-box',
    textAlign: 'center',
    fontSize: '1.03rem',
    fontFamily: 'inherit',
    fontWeight: 600,
    letterSpacing: '0.01em',
    borderRadius: 6,
    margin: '0 auto 18px auto',
    padding: '13px 18px 13px 18px',
    position: 'relative',
    boxShadow: '0px 2px 11px 0 rgba(23,87,83,0.13)',
    zIndex: 20,
    transition: 'opacity 0.23s, transform 0.18s',
    opacity: 1,
    transform: 'translateY(0px)',
    outline: 'none'
  };

  const bannerSuccessStyle = {
    background: '#d2f4e5',
    color: '#13795a',
    border: '1.5px solid #43b991'
  };

  const bannerErrorStyle = {
    background: '#fcdddd',
    color: '#c03528',
    border: '1.4px solid #e88e8a'
  };

  const formStyle = {
    width: '100%',
    maxWidth: 350,
    marginTop: '2.6rem',
    marginBottom: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    background: 'transparent',
    zIndex: 1
  };

  const headingStyle = {
    fontSize: '2rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    textAlign: 'center',
    marginTop: 0,
    marginBottom: '2rem',
    fontFamily: 'inherit',
    letterSpacing: '0.01em'
  };

  const inputStyle = {
    width: '100%',
    maxWidth: 330,
    height: 40,
    marginBottom: '1rem',
    border: 'none',
    borderRadius: 6,
    background: 'var(--form-bg)',
    paddingLeft: 16,
    fontSize: '1rem',
    fontFamily: 'inherit',
    color: 'var(--text-input)',
    fontWeight: 400,
    outline: 'none',
    transition: 'box-shadow 0.16s, background 0.16s',
    boxSizing: 'border-box'
  };

  const buttonStyle = {
    width: '100%',
    height: 44,
    marginTop: '1.3rem',
    marginBottom: '1.2rem',
    borderRadius: 6,
    border: 'none',
    background: 'var(--button-bg)',
    color: 'var(--button-text)',
    fontFamily: 'inherit',
    fontSize: '1.25rem',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background 0.14s, color 0.14s',
    boxShadow: '0px 2px 9px 0 rgba(20,76,76,0.07)',
    letterSpacing: '0.01em',
    outline: 'none'
  };

  const footerStyle = {
    marginTop: '1.3rem',
    textAlign: 'center',
    fontSize: '0.95rem',
    color: 'var(--text-footer)',
    fontFamily: 'inherit',
    fontWeight: 400,
    zIndex: 2,
    userSelect: 'none'
  };

  const loginLinkStyle = {
    color: 'var(--link)',
    fontWeight: 700,
    marginLeft: 4,
    cursor: 'pointer',
    textDecoration: 'underline transparent',
    transition: 'text-decoration-color 0.14s, color 0.14s'
  };

  const errorStyle = {
    color: '#c03528',
    fontSize: '0.93em',
    marginBottom: '0.5rem',
    textAlign: 'left',
    width: '100%'
  };

  function onLoginMouseOver(e) {
    e.currentTarget.style.color = '#055b5c';
    e.currentTarget.style.textDecorationColor = '#1ac9c6';
  }
  function onLoginMouseOut(e) {
    e.currentTarget.style.color = 'var(--link)';
    e.currentTarget.style.textDecorationColor = 'transparent';
  }
  function onButtonMouseOver(e) {
    e.currentTarget.style.background = '#066c75';
  }
  function onButtonMouseOut(e) {
    e.currentTarget.style.background = 'var(--button-bg)';
  }

  return (
    <div style={rootStyle}>
      <div style={bottomCurveStyle}/>
      <div style={centerWrapStyle}>
        {banner.visible && banner.message && (
          <div
            style={{
              ...bannerBaseStyle,
              ...(banner.type === 'success' ? bannerSuccessStyle : bannerErrorStyle)
            }}
            role={banner.type === 'success' ? 'status' : 'alert'}
            aria-live="polite"
            data-testid="signup-notification"
          >
            {banner.message}
          </div>
        )}
        <form style={formStyle} autoComplete="off" onSubmit={handleSubmit} noValidate>
          <h2 style={headingStyle}>Sign Up</h2>
          <input
            style={inputStyle}
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
            <div id="signup-username-error" style={errorStyle}>
              {errors.username}
            </div>
          )}
          <input
            style={inputStyle}
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
            <div id="signup-password-error" style={errorStyle}>
              {errors.password}
            </div>
          )}
          <input
            style={inputStyle}
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
            <div id="signup-confirm-error" style={errorStyle}>
              {errors.confirmPassword}
            </div>
          )}
          <button
            style={buttonStyle}
            type="submit"
            disabled={loading}
            onMouseOver={onButtonMouseOver}
            onMouseOut={onButtonMouseOut}
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>
        <div style={footerStyle}>
          Already have an account?{' '}
          <a
            style={loginLinkStyle}
            href="/login"
            onClick={goToLogin}
            onMouseOver={onLoginMouseOver}
            onMouseOut={onLoginMouseOut}
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
