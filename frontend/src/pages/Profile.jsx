import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, setUser, authFetch } from '../utils/auth';
import Navbar from '../components/Navbar';

const Profile = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(getUser());
  const [loading, setLoading] = useState(true);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [passwordData, setPasswordData] = useState({
    old_password: '',
    new_password: '',
    new_password2: ''
  });
  const [editData, setEditData] = useState({
    first_name: '',
    last_name: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authFetch('/auth/profile/');
        if (response.ok) {
          const data = await response.json();
          setUserData(data);
          setUser(data);
          setEditData({
            first_name: data.first_name || '',
            last_name: data.last_name || ''
          });
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handlePasswordChange = (e) =>
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });

  const handleEditChange = (e) =>
    setEditData({ ...editData, [e.target.name]: e.target.value });

  // ✅ Password strength validation function
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

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // ✅ Check if new passwords match
    if (passwordData.new_password !== passwordData.new_password2) {
      setPasswordError('New passwords do not match.');
      return;
    }

    // ✅ Check password strength
    const validationError = validatePassword(passwordData.new_password);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    try {
      const response = await authFetch('/auth/change-password/', {
        method: 'POST',
        body: JSON.stringify(passwordData),
      });

      if (response.ok) {
        setPasswordSuccess('Password updated successfully!');
        setPasswordData({
          old_password: '',
          new_password: '',
          new_password2: ''
        });
        setShowChangePassword(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = 'Failed to update password';
        if (errorData.old_password && Array.isArray(errorData.old_password)) {
          errorMessage = errorData.old_password[0];
        } else if (errorData.new_password && Array.isArray(errorData.new_password)) {
          errorMessage = errorData.new_password[0];
        } else if (errorData.new_password2 && Array.isArray(errorData.new_password2)) {
          errorMessage = errorData.new_password2[0];
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (typeof errorData === 'object') {
          const firstKey = Object.keys(errorData)[0];
          if (firstKey && errorData[firstKey] && Array.isArray(errorData[firstKey])) {
            errorMessage = errorData[firstKey][0];
          }
        }
        setPasswordError(errorMessage);
      }
    } catch (error) {
      setPasswordError('Failed to connect to server.');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    try {
      const response = await authFetch('/auth/profile/edit/', {
        method: 'PATCH',
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const data = await response.json();
        setProfileSuccess('Profile updated successfully!');
        setUserData(data);
        setUser(data);
        setShowEditProfile(false);
      } else {
        const errorData = await response.json();
        setProfileError(errorData.error || errorData.detail || 'Failed to update profile');
      }
    } catch (error) {
      setProfileError('Failed to connect to server.');
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Navbar />
        <div style={styles.loadingContainer}>
          <div style={styles.loadingText}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Navbar />
      <div style={styles.content}>
        <div style={styles.profileCard}>
          <h1 style={styles.title}>My Profile</h1>

          <div style={styles.userInfo}>
            <div style={styles.infoItem}>
              <label style={styles.label}>Username:</label>
              <span style={styles.value}>{userData?.username || 'N/A'}</span>
            </div>
            <div style={styles.infoItem}>
              <label style={styles.label}>Email:</label>
              <span style={styles.value}>{userData?.email || 'N/A'}</span>
            </div>
            <div style={styles.infoItem}>
              <label style={styles.label}>First Name:</label>
              <span style={styles.value}>{userData?.first_name || 'N/A'}</span>
            </div>
            <div style={styles.infoItem}>
              <label style={styles.label}>Last Name:</label>
              <span style={styles.value}>{userData?.last_name || 'N/A'}</span>
            </div>
          </div>

          <div style={styles.actionsGrid}>
            {/* Edit Profile Section */}
            <div style={styles.actionCard}>
              <div style={styles.actionHeader}>
                <h3 style={styles.actionTitle}>Edit Profile</h3>
                <button
                  onClick={() => setShowEditProfile(!showEditProfile)}
                  style={styles.toggleButton}
                >
                  {showEditProfile ? 'Cancel' : 'Edit'}
                </button>
              </div>

              {showEditProfile && (
                <form onSubmit={handleProfileSubmit} style={styles.form}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>First Name</label>
                    <input
                      type="text"
                      name="first_name"
                      value={editData.first_name}
                      onChange={handleEditChange}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      value={editData.last_name}
                      onChange={handleEditChange}
                      style={styles.input}
                    />
                  </div>

                  <button type="submit" style={styles.primaryButton}>
                    Update Profile
                  </button>

                  {profileError && <div style={styles.errorMessage}>{profileError}</div>}
                  {profileSuccess && <div style={styles.successMessage}>{profileSuccess}</div>}
                </form>
              )}
            </div>

            {/* Change Password Section */}
            <div style={styles.actionCard}>
              <div style={styles.actionHeader}>
                <h3 style={styles.actionTitle}>Change Password</h3>
                <button
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  style={styles.toggleButton}
                >
                  {showChangePassword ? 'Cancel' : 'Change'}
                </button>
              </div>

              {showChangePassword && (
                <form onSubmit={handlePasswordSubmit} style={styles.form}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Current Password</label>
                    <input
                      type="password"
                      name="old_password"
                      value={passwordData.old_password}
                      onChange={handlePasswordChange}
                      style={styles.input}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>New Password</label>
                    <input
                      type="password"
                      name="new_password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      style={styles.input}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Confirm New Password</label>
                    <input
                      type="password"
                      name="new_password2"
                      value={passwordData.new_password2}
                      onChange={handlePasswordChange}
                      style={styles.input}
                      required
                    />
                  </div>

                  <button type="submit" style={styles.primaryButton}>
                    Update Password
                  </button>

                  {passwordError && <div style={styles.errorMessage}>{passwordError}</div>}
                  {passwordSuccess && <div style={styles.successMessage}>{passwordSuccess}</div>}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #E6F3FF, #F0F8FF)',
    backgroundAttachment: 'fixed',
  },
  content: {
    padding: '2rem',
    display: 'flex',
    justifyContent: 'center',
  },
  profileCard: {
    background: 'rgba(255, 255, 255, 0.9)',
    padding: '2.5rem',
    borderRadius: '25px',
    boxShadow: '0 10px 30px rgba(94, 180, 232, 0.2)',
    width: '100%',
    maxWidth: '900px',
    backdropFilter: 'blur(8px)',
    border: '2px solid #B8DCF5',
  },
  title: {
    color: '#2C3E50',
    textAlign: 'center',
    fontSize: '2.2rem',
    fontWeight: '700',
    marginBottom: '2rem',
  },
  userInfo: {
    background: '#F8FBFF',
    border: '2px solid #B8DCF5',
    borderRadius: '15px',
    padding: '1.5rem',
    marginBottom: '2rem',
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.7rem 0',
    borderBottom: '1px solid #E6F3FF',
  },
  label: { fontWeight: '600', color: '#2C3E50' },
  value: { color: '#34495E', fontWeight: '500' },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    alignItems: 'start',
  },
  actionCard: {
    background: 'rgba(255,255,255,0.8)',
    borderRadius: '15px',
    padding: '1.5rem',
    border: '2px solid #B8DCF5',
    boxShadow: '0 6px 20px rgba(94,180,232,0.15)',
    height: 'auto',
  },
  actionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '1rem',
  },
  actionTitle: { color: '#5EB4E8', fontWeight: '600', fontSize: '1.2rem' },
  toggleButton: {
    background: '#5EB4E8',
    color: '#ffffff',
    border: '1px solid #8BC8F0',
    borderRadius: '10px',
    padding: '0.6rem 1.2rem',
    cursor: 'pointer',
    transition: '0.3s',
  },
  formGroup: { marginBottom: '1rem' },
  formLabel: { color: '#2C3E50', fontWeight: '600', marginBottom: '0.4rem' },
  input: {
    width: '100%',
    padding: '0.8rem',
    borderRadius: '10px',
    border: '2px solid #B8DCF5',
    outline: 'none',
    fontSize: '0.95rem',
    backgroundColor: '#F8FBFF',
  },
  primaryButton: {
    background: '#5EB4E8',
    color: '#fff',
    border: '1px solid #8BC8F0',
    borderRadius: '12px',
    padding: '0.8rem 1.5rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: '0.3s',
  },
  errorMessage: {
    background: '#FFE6E6',
    color: '#E74C3C',
    borderRadius: '10px',
    padding: '0.6rem',
    marginTop: '0.5rem',
    textAlign: 'center',
    border: '1px solid #E74C3C',
  },
  successMessage: {
    background: '#E6F3FF',
    color: '#2C3E50',
    borderRadius: '10px',
    padding: '0.6rem',
    marginTop: '0.5rem',
    textAlign: 'center',
    border: '1px solid #5EB4E8',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '50vh',
  },
  loadingText: {
    color: '#5EB4E8',
    fontSize: '1.2rem',
    fontWeight: '600',
  },
};

export default Profile;
