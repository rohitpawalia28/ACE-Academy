import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Gets the role from the URL (e.g., ?role=student)
  const role = searchParams.get('role') || 'student';

  // State to hold what the user types
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevents the page from refreshing
    setError('');
    setLoading(true);

    try {
      // Send the data to your backend server
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        // This will catch wrong passwords or your custom "Double Login" error!
        throw new Error(data.message || 'Login failed');
      }

      // If successful, save the token to the browser's local storage
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('username', username);

      // Send them to the correct dashboard
      if (data.role === 'student') navigate('/student-dashboard');
      else if (data.role === 'teacher') navigate('/teacher-dashboard');
      else if (data.role === 'admin') navigate('/admin-dashboard');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <img src="/ace-logo.png" alt="ACE Logo" className="login-logo" />
          <h2>ACE Academy</h2>
          <p>{role.charAt(0).toUpperCase() + role.slice(1)} Portal</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
          <div className="input-group">
            <label>Username (ID)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your ID"
            />
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>

        <p className="contact-admin">
          Lost your ID/Password? <br />
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSeeg13uuKiZSsO5qqA6HA_S_zV7uSqQd1J_6VqJMnxdam4X4g/viewform?usp=dialog"
            target="_blank"
            rel="noopener noreferrer"
            className="contact-link"
          >
            Contact Admin via Google Form
          </a>
        </p>
        <p className="new-user-link">
          New User?{" "}
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSeqv6KbXlzByyFF8YktfdSob21grOcEwuKkhNxud5li8n0VKg/viewform?usp=publish-editor"
            target="_blank"
            rel="noopener noreferrer"
          >
            Apply for Credentials
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;