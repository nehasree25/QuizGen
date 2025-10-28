import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setTokens, setUser } from '../utils/auth';

const Signup = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:8000/auth/signup/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Since your backend only returns success message, redirect to login
        setError('✅ Signup successful! Please login.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        // Handle validation errors
        if (data.username) {
          setError(`Username: ${data.username[0]}`);
        } else if (data.email) {
          setError(`Email: ${data.email[0]}`);
        } else if (data.password) {
          setError(`Password: ${data.password[0]}`);
        } else if (data.detail) {
          setError(data.detail);
        } else {
          setError('Signup failed. Please check your input.');
        }
      }
    } catch (err) {
      setError('Failed to connect to server. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <h1>Create Account</h1>
        <p className="subtitle">Sign up to get started</p>

        <form onSubmit={handleSubmit} className="quiz-form">
          <div className="form-group">
            <label>Username:</label>
            <input 
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required 
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label>Email:</label>
            <input 
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required 
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label>First Name:</label>
            <input 
              type="text"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="Enter your first name (optional)"
            />
          </div>

          <div className="form-group">
            <label>Last Name:</label>
            <input 
              type="text"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Enter your last name (optional)"
            />
          </div>
          
          <div className="form-group">
            <label>Password:</label>
            <input 
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required 
              placeholder="Create a password"
            />
          </div>

          <div className="form-group">
            <label>Confirm Password:</label>
            <input 
              type="password"
              name="password2"
              value={formData.password2}
              onChange={handleChange}
              required 
              placeholder="Confirm your password"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="generate-btn"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <span style={{ color: '#666' }}>
              Already have an account?{' '}
              <Link 
                to="/login" 
                style={{ 
                  color: '#256178', 
                  textDecoration: 'none',
                  fontWeight: '600'
                }}
              >
                Sign in
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup;