import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { setTokens, setUser, authFetch } from '../utils/auth';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
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
      const response = await fetch('http://localhost:8000/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store JWT tokens
        setTokens(data.access, data.refresh);
        
        // Fetch user profile after login
        try {
          const profileResponse = await authFetch('http://localhost:8000/auth/profile/');
          if (profileResponse.ok) {
            const userData = await profileResponse.json();
            setUser(userData);
          }
        } catch (profileError) {
          console.log('Profile fetch failed:', profileError);
        }
        
        navigate('/home');
      } else {
        setError(data.detail || 'Login failed. Please check your credentials.');
      }
    } catch (err) {
      setError('Failed to connect to server. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <h1>Welcome Back</h1>
        <p className="subtitle">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="quiz-form">
          <div className="form-group">
            <label>Username or Email:</label>
            <input 
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required 
              placeholder="Enter your username or email"
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
              placeholder="Enter your password"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="generate-btn"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
          
          {error && (
            <div className="error-message">
              ❌ {error}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <span style={{ color: '#666' }}>
              Don't have an account?{' '}
              <Link 
                to="/signup" 
                style={{ 
                  color: '#256178', 
                  textDecoration: 'none',
                  fontWeight: '600'
                }}
              >
                Sign up
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;