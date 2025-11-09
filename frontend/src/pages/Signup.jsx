import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

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

  // ✅ Validate password strength
  const validatePassword = (password) => {
    const minLength = /.{6,}/;
    const upperCase = /[A-Z]/;
    const lowerCase = /[a-z]/;
    const number = /[0-9]/;
    const specialChar = /[!@#$%^&*(),.?":{}|<>]/;

    if (!minLength.test(password)) {
      return "Password must be at least 6 characters long.";
    }
    if (!upperCase.test(password)) {
      return "Password must contain at least one uppercase letter (A-Z).";
    }
    if (!lowerCase.test(password)) {
      return "Password must contain at least one lowercase letter (a-z).";
    }
    if (!number.test(password)) {
      return "Password must contain at least one number (0-9).";
    }
    if (!specialChar.test(password)) {
      return "Password must contain at least one special symbol (!@#$%^&*).";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Clear old errors

    // ✅ Password validation first (before loading state)
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // ✅ Password match check
    if (formData.password !== formData.password2) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/auth/signup/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setError('Signup successful! Please login.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        let errorMessage = 'Signup failed. Please check your input.';
        if (data.username && Array.isArray(data.username)) {
          errorMessage = `Username: ${data.username[0]}`;
        } else if (data.email && Array.isArray(data.email)) {
          errorMessage = `Email: ${data.email[0]}`;
        } else if (data.password && Array.isArray(data.password)) {
          errorMessage = `Password: ${data.password[0]}`;
        } else if (data.password2 && Array.isArray(data.password2)) {
          errorMessage = `Password confirmation: ${data.password2[0]}`;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (typeof data === 'object') {
          const firstKey = Object.keys(data)[0];
          if (firstKey && data[firstKey] && Array.isArray(data[firstKey])) {
            errorMessage = `${firstKey}: ${data[firstKey][0]}`;
          } else if (firstKey && typeof data[firstKey] === 'string') {
            errorMessage = data[firstKey];
          }
        }
        setError(errorMessage);
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
              <center><div>{error}</div></center>
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
