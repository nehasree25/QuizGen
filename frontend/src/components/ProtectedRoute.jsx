import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../utils/auth';

const ProtectedRoute = ({ children }) => {
  console.log('ProtectedRoute: isAuthenticated', isAuthenticated());
  
  if (!isAuthenticated()) {
    console.log('Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('Authenticated, rendering children');
  return children;
};

export default ProtectedRoute;