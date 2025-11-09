import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { removeTokens, getRefreshToken, authFetch, removeUser } from "../utils/auth";

function Navbar() {
  const navigate = useNavigate();
  // navigation-only: generation handled on its dedicated page

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
          // Continue with logout even if API call fails
          console.error('Logout API call failed:', error);
        }
      }
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Always clear local storage and navigate
      removeTokens();
      removeUser();
      navigate('/login');
    }
  };

  const handleGenerate = () => {
    // Navigate to the generate-quiz page where the user can pick domain/subdomain/level
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
