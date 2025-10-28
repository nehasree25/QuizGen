import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getUser, removeTokens, removeUser } from '../utils/auth';

const Navbar = () => {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    removeTokens();
    removeUser();
    navigate('/login');
  };

  return (
    <nav style={styles.navbar}>
      <div style={styles.navLeft}>
        <span style={styles.userName}>
          Welcome, {user?.username || user?.first_name || 'User'}!
        </span>
      </div>
      
      <div style={styles.navRight}>
        <Link to="/home" style={styles.navLink}>Home</Link>
        <Link to="/history" style={styles.navLink}>History</Link>
        <Link to="/profile" style={styles.navLink}>Profile</Link>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          Logout
        </button>
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem',
    backgroundColor: '#ffffff',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
    borderBottom: '2px solid #e6f7ff',
  },
  navLeft: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#256178',
  },
  userName: {
    color: '#333333',
  },
  navRight: {
    display: 'flex',
    gap: '1.5rem',
    alignItems: 'center',
  },
  navLink: {
    textDecoration: 'none',
    color: '#333333',
    fontWeight: '500',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    transition: 'all 0.3s ease',
  },
  logoutBtn: {
    backgroundColor: '#ff6b6b',
    color: 'white',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.3s ease',
  },
};

// Add hover effects
document.addEventListener('DOMContentLoaded', function() {
  const style = document.createElement('style');
  style.textContent = `
    a[style*="navLink"]:hover {
      background-color: #f0faff !important;
      color: #256178 !important;
    }
    button[style*="logoutBtn"]:hover {
      background-color: #ff5252 !important;
      transform: translateY(-1px);
    }
  `;
  document.head.appendChild(style);
});

export default Navbar;