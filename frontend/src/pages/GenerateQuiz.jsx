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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!domain || !subDomain || !level) {
      setError('Please fill domain, sub-domain and level');
      return;
    }

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
        if (body && body.number_of_questions) {
          setError('Number of questions must be 20 or less');
        } else if (body && typeof body === 'object') {
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
      const quizId = data.quiz_id || data.id || null;

      if (!questions.length) {
        setError('No questions returned from server.');
        return;
      }

      // ✅ Directly navigate to the quiz page (no Start Quiz step)
      navigate('/quiz', {
        state: {
          questions,
          quizId,
          currentIndex: 0,
          domain,
          sub_domain: subDomain,
          level,
        },
      });

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
            </div>

            <button type="submit" disabled={loading} className="generate-btn">
              {loading ? 'Generating...' : 'Generate Quiz'}
            </button>

            {error && (
              <div className="error-message" style={{ marginTop: 12 }}>
                {error}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default GenerateQuiz;
