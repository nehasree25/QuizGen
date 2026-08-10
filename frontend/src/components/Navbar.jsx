import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { removeTokens, getRefreshToken, authFetch, removeUser } from "../utils/auth";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Call backend API to blacklist the refresh token
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          await authFetch('/auth/logout/', {
            method: 'POST',
            body: JSON.stringify({ refresh: refreshToken }),
          });
        } catch (error) {
          console.error('Logout API call failed:', error);
        }
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Always clear tokens and user data
      removeTokens();
      removeUser();
      // Redirect to login, replace history so back button won't return home
      navigate('/login', { replace: true });
    }
  };

  const handleGenerate = () => {
    navigate('/generate-quiz');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">QuizGen</div>
      <ul className="navbar-links">
        <li><Link to="/">Dashboard</Link></li>
        <li><Link to="/history">History</Link></li>
        <li><Link to="/profile">Profile</Link></li>
        <li>
          <button
            onClick={handleGenerate}
            className="generate-link"
          >
            Generate Quiz
          </button>
        </li>
      </ul>
      <button className="logout-btn" onClick={handleLogout}>Logout</button>
    </nav>
  );
}

export default Navbar;
