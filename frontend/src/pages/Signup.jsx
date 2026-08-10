import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config';

const Signup = () => {
  // OTP flow removed — signup posts directly to backend

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

  // ✅ Password validation
  const validatePassword = (password) => {
    const minLength = /.{6,}/;
    const upperCase = /[A-Z]/;
    const lowerCase = /[a-z]/;
    const number = /[0-9]/;
    const specialChar = /[!@#$%^&*(),.?":{}|<>]/;

    if (!minLength.test(password)) return "Password must be at least 6 characters.";
    if (!upperCase.test(password)) return "Must include uppercase letter.";
    if (!lowerCase.test(password)) return "Must include lowercase letter.";
    if (!number.test(password)) return "Must include a number.";
    if (!specialChar.test(password)) return "Must include a special character.";

    return null;
  };

  // Signup directly (no OTP)
  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');

    // Validate password
    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (formData.password !== formData.password2) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...formData })
      });

      const data = await response.json();

      if (response.ok) {
        setError("🎉 Signup successful! Redirecting...");
        setTimeout(() => navigate('/login'), 2000);
      } else {
        // show first error message returned by backend
        const firstKey = Object.keys(data)[0];
        const firstMsg = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
        setError(firstMsg || "Signup failed. Check inputs.");
      }
    } catch {
      setError("Server error. Try again.");
    }

    setLoading(false);
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <h1>Create Account</h1>
        <p className="subtitle">Fill details to create account</p>

        {/* ================= STEP 1 FORM ================= */}
          <form onSubmit={handleSignup} className="quiz-form">
            <div className="form-group">
              <label>Username</label>
              <input name="username" onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input type="email" name="email" onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>First Name</label>
              <input name="first_name" onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input name="last_name" onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input type="password" name="password" onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input type="password" name="password2" onChange={handleChange} required />
            </div>

            <button disabled={loading} className="generate-btn">
              {loading ? "Signing up..." : "Sign up"}
            </button>
          </form>
        

        {/* ================= ERROR ================= */}
        {error && (
          <div className="error-message" style={{ marginTop: '1rem' }}>
            <center>{error}</center>
          </div>
        )}

        <div style={{ marginTop: '1rem' }}>
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;