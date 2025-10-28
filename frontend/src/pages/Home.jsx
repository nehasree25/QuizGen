import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { authFetch } from '../utils/auth';

const Home = () => {
  const [domain, setDomain] = useState('');
  const [subDomain, setSubDomain] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState(5);
  const [level, setLevel] = useState('easy');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showQuizForm, setShowQuizForm] = useState(false);
  const navigate = useNavigate();

  const handleTakeQuiz = () => {
    setShowQuizForm(true);
  };

  const handleViewHistory = () => {
    navigate('/history');
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await authFetch('http://localhost:8000/generate-quiz/', {
        method: 'POST',
        body: JSON.stringify({
          domain: domain.trim(),
          sub_domain: subDomain.trim(),
          number_of_questions: parseInt(numberOfQuestions),
          level: level,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const questions = await response.json();
      
      if (Array.isArray(questions) && questions.length > 0) {
        navigate('/quiz', { state: { questions } });
      } else {
        setError('No questions received. Please try again.');
      }
      
    } catch (err) {
      setError(`Failed to generate quiz: ${err.message}`);
      console.error('Error:', err);
    }
    
    setLoading(false);
  };

  // If showQuizForm is true, show the quiz generation form
  if (showQuizForm) {
    return (
      <div style={styles.container}>
        <Navbar />
        <div className="home-container">
          <div className="home-card">
            <h1>Create Your Quiz</h1>
            
            <form onSubmit={handleQuizSubmit} className="quiz-form">
              <div className="form-group">
                <label>Domain:</label>
                <input 
                  value={domain} 
                  onChange={e => setDomain(e.target.value)} 
                  required 
                  placeholder="e.g., Java, Python, History"
                />
              </div>
              
              <div className="form-group">
                <label>Sub-domain:</label>
                <input 
                  value={subDomain} 
                  onChange={e => setSubDomain(e.target.value)} 
                  required 
                  placeholder="e.g., Class, Functions, World War 2"
                />
              </div>
              
              <div className="form-group">
                <label>Number of Questions:</label>
                <input 
                  type="number" 
                  min="1" 
                  max="20" 
                  value={numberOfQuestions} 
                  onChange={e => setNumberOfQuestions(e.target.value)} 
                  required 
                />
              </div>
              
              <div className="form-group">
                <label>Difficulty Level:</label>
                <select value={level} onChange={e => setLevel(e.target.value)}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              
              <div style={styles.formButtons}>
                <button 
                  type="button"
                  onClick={() => setShowQuizForm(false)}
                  style={styles.backButton}
                >
                  ← Back to Dashboard
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="generate-btn"
                >
                  {loading ? ' Generating...' : ' Generate Quiz'}
                </button>
              </div>
              
              {error && (
                <div className="error-message">
                  ❌ {error}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Show the dashboard with buttons
  return (
    <div style={styles.container}>
      <Navbar />
      
      <div style={styles.content}>
        <div style={styles.welcomeSection}>
          <h1 style={styles.welcomeTitle}>Welcome to QuizGen</h1>
          <p style={styles.welcomeSubtitle}>
            Test your knowledge with our interactive quizzes
          </p>
        </div>

        <div style={styles.actionsSection}>
          <div style={styles.actionCard}>
            <h3 style={styles.actionTitle}>Take a Quiz</h3>
            <p style={styles.actionDescription}>
              Generate a new quiz based on your preferred domain and difficulty level.
            </p>
            <button 
              onClick={handleTakeQuiz}
              style={styles.actionButton}
            >
              Start Quiz
            </button>
          </div>

          <div style={styles.actionCard}>
            <h3 style={styles.actionTitle}>Quiz History</h3>
            <p style={styles.actionDescription}>
              View your previous quiz attempts and track your progress over time.
            </p>
            <button 
              onClick={handleViewHistory}
              style={styles.historyButton}
            >
              View History
            </button>
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
  },
  content: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  welcomeSection: {
    textAlign: 'center',
    marginBottom: '3rem',
    padding: '2rem',
  },
  welcomeTitle: {
    color: '#256178',
    fontSize: '2.5rem',
    marginBottom: '1rem',
    fontWeight: '700',
  },
  welcomeSubtitle: {
    color: '#666',
    fontSize: '1.2rem',
    lineHeight: '1.6',
  },
  actionsSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '2rem',
    padding: '0 1rem',
  },
  actionCard: {
    background: '#ffffff',
    padding: '2.5rem',
    borderRadius: '15px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
    border: '2px solid #e6f7ff',
  },
  actionTitle: {
    color: '#256178',
    fontSize: '1.5rem',
    marginBottom: '1rem',
    fontWeight: '600',
  },
  actionDescription: {
    color: '#666',
    lineHeight: '1.6',
    marginBottom: '2rem',
  },
  actionButton: {
    padding: '1rem 2rem',
    backgroundColor: '#87ceeb',
    color: 'black',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '100%',
  },
  historyButton: {
    padding: '1rem 2rem',
    backgroundColor: '#e6f7ff',
    color: '#333',
    border: '2px solid #87ceeb',
    borderRadius: '10px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '100%',
  },
  formButtons: {
    display: 'flex',
    gap: '1rem',
    marginTop: '1rem',
  },
  backButton: {
    padding: '1rem 2rem',
    backgroundColor: '#e6f7ff',
    color: '#333',
    border: '2px solid #87ceeb',
    borderRadius: '10px',
    fontSize: '1.1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    flex: 1,
  },
};

export default Home;