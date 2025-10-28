import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, setUser, removeTokens, removeUser, authFetch } from '../utils/auth';
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
        const response = await authFetch('http://localhost:8000/auth/profile/');
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

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleEditChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (passwordData.new_password !== passwordData.new_password2) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      const response = await authFetch('http://localhost:8000/auth/change-password/', {
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
        const errorData = await response.json();
        if (errorData.old_password) {
          setPasswordError(`Current password: ${errorData.old_password[0]}`);
        } else if (errorData.new_password) {
          setPasswordError(`New password: ${errorData.new_password[0]}`);
        } else {
          setPasswordError('Failed to update password');
        }
      }
    } catch (error) {
      setPasswordError('Failed to connect to server');
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    try {
      console.log('Sending profile update data:', editData);
      const response = await authFetch('http://localhost:8000/auth/profile/edit/', {
        method: 'PATCH',
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const data = await response.json();
        setProfileSuccess('Profile updated successfully!');
        setUserData(data);
        setUser(data);
        setShowEditProfile(false);
        
        // Refresh the profile data
        const profileResponse = await authFetch('http://localhost:8000/auth/profile/');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setUserData(profileData);
          setEditData({
            first_name: profileData.first_name || '',
            last_name: profileData.last_name || ''
          });
        }
      } else {
        const errorData = await response.json();
        console.error('Profile update error:', errorData);
        console.error('Response status:', response.status);
        setProfileError(errorData.error || errorData.detail || JSON.stringify(errorData) || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update catch error:', error);
      setProfileError('Failed to connect to server: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <Navbar />
        <div style={styles.content}>
          <div style={styles.profileCard}>
            <div style={styles.loading}>Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <Navbar />
      
      <div style={styles.content}>
        <div style={styles.profileCard}>
          <h1 style={styles.title}>Profile</h1>
          
          {/* Profile Information */}
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

          {/* Edit Profile and Change Password Side by Side */}
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
                    <label style={styles.formLabel}>First Name:</label>
                    <input 
                      type="text"
                      name="first_name"
                      value={editData.first_name}
                      onChange={handleEditChange}
                      style={styles.input}
                      placeholder="Enter first name"
                    />
                  </div>
                  
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Last Name:</label>
                    <input 
                      type="text"
                      name="last_name"
                      value={editData.last_name}
                      onChange={handleEditChange}
                      style={styles.input}
                      placeholder="Enter last name"
                    />
                  </div>
                  
                  <button type="submit" style={styles.primaryButton}>
                    Update Profile
                  </button>
                  
                  {profileError && (
                    <div style={styles.errorMessage}>
                      {profileError}
                    </div>
                  )}
                  
                  {profileSuccess && (
                    <div style={styles.successMessage}>
                      {profileSuccess}
                    </div>
                  )}
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
                    <label style={styles.formLabel}>Current Password:</label>
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
                    <label style={styles.formLabel}>New Password:</label>
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
                    <label style={styles.formLabel}>Confirm New Password:</label>
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
                  
                  {passwordError && (
                    <div style={styles.errorMessage}>
                      {passwordError}
                    </div>
                  )}
                  
                  {passwordSuccess && (
                    <div style={styles.successMessage}>
                      {passwordSuccess}
                    </div>
                  )}
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
    backgroundColor: '#f0faff',
    background: 'linear-gradient(135deg, #f0faff 0%, #e6f7ff 100%)',
  },
  content: {
    padding: '2rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: '80vh',
  },
  profileCard: {
    background: '#ffffff',
    padding: '3rem',
    borderRadius: '20px',
    boxShadow: '0 20px 60px rgba(135, 206, 235, 0.15)',
    width: '100%',
    maxWidth: '900px',
    border: '2px solid #e6f7ff',
  },
  title: {
    color: '#256178',
    textAlign: 'center',
    marginBottom: '2.5rem',
    fontSize: '2.5rem',
    fontWeight: '700',
    background: 'linear-gradient(135deg, #256178 0%, #87ceeb 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  userInfo: {
    marginBottom: '3rem',
    padding: '2rem',
    backgroundColor: '#f8fbfe',
    borderRadius: '15px',
    border: '1px solid #e6f7ff',
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 0',
    borderBottom: '1px solid #e6f7ff',
  },
  label: {
    fontWeight: '600',
    color: '#256178',
    fontSize: '1rem',
  },
  value: {
    color: '#4a6572',
    fontSize: '1rem',
    fontWeight: '500',
  },
  actionsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem',
  },
  actionCard: {
    padding: '2rem',
    backgroundColor: '#f8fbfe',
    borderRadius: '15px',
    border: '1px solid #e6f7ff',
    transition: 'all 0.3s ease',
  },
  actionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem',
  },
  actionTitle: {
    color: '#256178',
    fontSize: '1.3rem',
    fontWeight: '600',
    margin: 0,
  },
  toggleButton: {
    padding: '0.7rem 1.2rem',
    backgroundColor: '#87ceeb',
    color: '#1a365d',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  formLabel: {
    fontWeight: '600',
    color: '#256178',
    fontSize: '0.9rem',
  },
  input: {
    padding: '0.9rem',
    border: '2px solid #e6f7ff',
    borderRadius: '8px',
    fontSize: '0.95rem',
    backgroundColor: '#ffffff',
    transition: 'all 0.3s ease',
    outline: 'none',
  },
  primaryButton: {
    padding: '0.9rem 1.5rem',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '0.5rem',
  },
  errorMessage: {
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeaa7',
    color: '#856404',
    padding: '0.8rem',
    borderRadius: '8px',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: '0.85rem',
  },
  successMessage: {
    backgroundColor: '#d1edff',
    border: '1px solid #87ceeb',
    color: '#256178',
    padding: '0.8rem',
    borderRadius: '8px',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: '0.85rem',
  },
  loading: {
    textAlign: 'center',
    color: '#256178',
    fontSize: '1.2rem',
    fontWeight: '600',
  },
};

// Add hover effects
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  button[style*="toggleButton"]:hover {
    background-color: #63b7db !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(135, 206, 235, 0.3);
  }
  
  button[style*="primaryButton"]:hover {
    background-color: #45a049 !important;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
  }
  
  input[style*="input"]:focus {
    border-color: #87ceeb !important;
    box-shadow: 0 0 0 3px rgba(135, 206, 235, 0.2);
  }
  
  .actionCard:hover {
    box-shadow: 0 8px 25px rgba(135, 206, 235, 0.1);
    transform: translateY(-2px);
  }
`;
document.head.appendChild(styleSheet);

export default Profile;