import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../App.css';
import { authFetch } from '../utils/auth';

function GenerateQuiz() {
  const navigate = useNavigate();
  const [domain, setDomain] = useState('');
  const [subDomain, setSubDomain] = useState('');
  const [level, setLevel] = useState('');
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState(null);
  const [generatedQuizId, setGeneratedQuizId] = useState(null);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!domain || !subDomain || !level) {
      setError('Please fill domain, sub-domain and level');
      return;
    }

    // Validate number of questions before making the request
    if (numberOfQuestions > 20) {
      setError('Number of questions must be 20 or less');
      return;
    }

    if (numberOfQuestions < 1) {
      setError('Number of questions must be at least 1');
      return;
    }

    setLoading(true);
    try {
        const payload = {
          domain,
          sub_domain: subDomain,
          number_of_questions: Number(numberOfQuestions) || 10,
          level,
        };

      const resp = await authFetch('/generate-quiz/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const body = await resp.json().catch(() => null);
        
        // Handle specific validation errors
        if (body && body.number_of_questions) {
          setError('Number of questions must be 20 or less');
        } else if (body && typeof body === 'object') {
          // Handle other field-specific errors
          const errorMessages = Object.entries(body)
            .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages[0] : messages}`)
            .join(', ');
          setError(errorMessages || 'Please check your input values');
        } else {
          setError(body ? JSON.stringify(body) : `Server error ${resp.status}`);
        }
        return;
      }

      const data = await resp.json();
      const questions = data.questions || data.question_list || data.questions_list || [];
      const resumeIndex = data.current_index || data.resume_index || 0;
      const quizId = data.quiz_id || data.id || null;
      const total = data.total_questions || data.total || questions.length;

      if (!questions.length) {
        setError('No questions returned from server.');
        return;
      }

      // Store generated data and show a summary so user can start when ready
      setGeneratedQuestions({ questions, resumeIndex });
      setGeneratedQuizId(quizId);
      setTotalQuestions(total);
    } catch (err) {
      console.error('Generate quiz error:', err);
      setError('Failed to generate quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNumberOfQuestionsChange = (e) => {
    const value = e.target.value;
    setNumberOfQuestions(value);
    
    // Clear error when user starts correcting the value
    if (error && error.includes('Number of questions')) {
      setError('');
    }
  };

  return (
    <div className="home">
      <Navbar />
      <div className="home-container">
        <div className="home-card">
          <h1 style={{ color: 'var(--primary-color)' }}>Generate Quiz</h1>
          <p className="subtitle">Choose domain, sub-domain and difficulty</p>

          <form onSubmit={handleSubmit} className="quiz-form">
            <div className="form-group">
              <label>Domain</label>
              <input
                type="text"
                name="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. Mathematics"
                required
              />
            </div>

            <div className="form-group">
              <label>Sub-domain</label>
              <input
                type="text"
                name="sub_domain"
                value={subDomain}
                onChange={(e) => setSubDomain(e.target.value)}
                placeholder="e.g. Algebra"
                required
              />
            </div>

            <div className="form-group">
              <label>Level</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} required>
                <option value="">Select level</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="form-group">
              <label>Number of questions (max: 20)</label>
              <input
                type="number"
                min={1}
                max={20}
                value={numberOfQuestions}
                onChange={handleNumberOfQuestionsChange}
                required
              />
              {/* <div className="input-hint">Maximum 20 questions allowed</div> */}
            </div>

            <button type="submit" disabled={loading} className="generate-btn">
              {loading ? 'Generating...' : 'Generate'}
            </button>

            {error && (
              <div className="error-message" style={{ marginTop: 12 }}>
                {error}
              </div>
            )}
          </form>

          {generatedQuestions && (
            <div style={{ marginTop: 18, textAlign: 'center' }}>
              <p><strong>Questions generated:</strong> {totalQuestions}</p>
              <p>Ready to start the quiz with {generatedQuestions.questions.length} questions.</p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 8 }}>
                <button
                  className="generate-btn"
                  onClick={() => navigate('/quiz', { state: { ...generatedQuestions, quizId: generatedQuizId } })}
                >
                  Start Quiz
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GenerateQuiz;