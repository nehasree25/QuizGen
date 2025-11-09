import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar";
import "../App.css";
import { authFetch } from '../utils/auth';

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const resp = await authFetch('/quiz-history/');
        if (!resp.ok) {
          console.error('Failed to fetch history', resp.status);
          setHistory([]);
          return;
        }

        const data = await resp.json();
        setHistory(Array.isArray(data) ? data : (data.results || []));
      } catch (error) {
        console.error('Error fetching history:', error);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // ✅ Resume quiz properly with saved progress
  const openQuiz = async (quiz) => {
    try {
      const isCompleted = quiz.completed || (quiz.status && quiz.status.toLowerCase() === 'completed');

      // If quiz is completed → view results
      if (isCompleted) {
        const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
        const userAnswers = quiz.user_answers || [];

        if (!questions.length) {
          alert('No questions found for this quiz.');
          return;
        }

        navigate('/results', {
          state: {
            questions,
            userAnswers,
            quizId: quiz.id,
            domain: quiz.domain,
            sub_domain: quiz.sub_domain,
            score: quiz.score
          },
        });
        return;
      }

      // ✅ Resume quiz from saved progress
      const payload = { domain: quiz.domain, sub_domain: quiz.sub_domain };
      const res = await authFetch('/resume-quiz/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        alert('Failed to resume quiz.');
        return;
      }

      const data = await res.json();

      // ✅ Use saved progress (current_question_index)
      const questions = data.questions || [];
      const resumeIndex = data.current_question_index || 0;
      const userAnswers = data.user_answers || [];

      navigate('/quiz', {
        state: {
          quizId: data.quiz_id,
          questions,
          resumeIndex,
          userAnswers,
          domain: quiz.domain,
          sub_domain: quiz.sub_domain,
        },
      });

    } catch (err) {
      console.error('Error opening quiz:', err);
      alert('Failed to open quiz.');
    }
  };

  return (
    <div className="history-page">
      <Navbar />
      <div className="history-container">
        <h1>Quiz History</h1>

        <main className="history-filter" style={{ marginBottom: '1rem' }}>
          <div style={{
            display: 'inline-flex',
            gap: '0.5rem',
            background: '#f6f7fb',
            padding: '6px',
            borderRadius: '8px'
          }}>
            {['all', 'completed', 'incomplete'].map((type) => (
              <button
                key={type}
                className={`filter-btn ${filter === type ? 'active' : ''}`}
                onClick={() => setFilter(type)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid var(--primary-color)',
                  background: filter === type ? 'var(--primary-color)' : 'transparent',
                  color: filter === type ? '#fff' : 'var(--primary-color)',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </main>

        <div className="history-list">
          {loading && <p style={{ textAlign: 'center', color: '#666' }}>Loading...</p>}
          {!loading && (() => {
            const filtered = history.filter(q => {
              if (filter === 'all') return true;
              const isCompleted = q.completed || (q.status && String(q.status).toLowerCase() === 'completed');
              return filter === 'completed' ? isCompleted : !isCompleted;
            });

            if (filtered.length === 0) {
              const msg =
                filter === 'completed'
                  ? 'No completed quizzes'
                  : filter === 'incomplete'
                    ? 'No incomplete quizzes'
                    : 'No quizzes found';
              return (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  minHeight: '200px',
                  color: '#666'
                }}>
                  <p>{msg}</p>
                </div>
              );
            }

            return filtered.map((quiz) => (
              quiz && (
                <div
                  key={quiz.id}
                  className={`history-card ${String(quiz.status || '').toLowerCase()}`}
                  style={{
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1rem',
                    background: '#fff',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                  }}
                >
                  <h3>{quiz.domain} - {quiz.sub_domain}</h3>
                  <p>Status: {quiz.status}</p>
                  {quiz.score !== null && quiz.score !== undefined && (
                    <p>Score: {quiz.score.toFixed(2)}%</p>
                  )}

                  {/* ✅ Removed Date/Time line */}

                  <div style={{ marginTop: '0.5rem' }}>
                    <button
                      className="history-btn"
                      onClick={() => openQuiz(quiz)}
                      style={{
                        background: 'var(--primary-color)',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      {quiz.status && quiz.status.toLowerCase() === 'completed' ? 'View' : 'Resume'}
                    </button>
                  </div>
                </div>
              )
            ));
          })()}
        </div>
      </div>
    </div>
  );
}

export default History;
