import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './utils/auth';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Quiz from './pages/Quiz';
import Results from './pages/Results';
import Profile from './pages/Profile';
import History from './pages/History';
import GenerateQuiz from './pages/GenerateQuiz';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated() ? <Navigate to="/home" replace /> : <Login />
            } 
          />
          <Route 
            path="/signup" 
            element={
              isAuthenticated() ? <Navigate to="/home" replace /> : <Signup />
            } 
          />
          
          {/* Protected routes */}
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/history" 
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/generate-quiz"
            element={
              <ProtectedRoute>
                <GenerateQuiz />
              </ProtectedRoute>
            }
          />
          
          {/* Quiz routes - protected */}
          <Route 
            path="/quiz" 
            element={
              <ProtectedRoute>
                <Quiz />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/results" 
            element={
              <ProtectedRoute>
                <Results />
              </ProtectedRoute>
            } 
          />
          
          {/* Default routes */}
          <Route 
            path="/" 
            element={
              <Navigate to="/home" replace />
            } 
          />
          
          {/* Catch all route */}
          <Route 
            path="*" 
            element={
              <Navigate to={isAuthenticated() ? "/home" : "/login"} replace />
            } 
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;