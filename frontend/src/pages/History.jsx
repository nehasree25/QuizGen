import { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import Navbar from "../components/Navbar";
import "../App.css";
import { authFetch } from '../utils/auth';

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'completed' | 'incomplete'
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

  const openQuiz = async (quiz) => {
    try {
      const isCompleted = quiz.completed || (quiz.status && quiz.status.toLowerCase() === 'completed');
      
      // For completed quizzes, use data from history
      if (isCompleted) {
        console.log('Opening completed quiz:', quiz);
        if (!quiz.questions) {
          console.error('No questions found in quiz data:', quiz);
          alert('Quiz data is incomplete. Please try again.');
          return;
        }
        const questions = Array.isArray(quiz.questions) ? quiz.questions : [];
        const userAnswers = quiz.user_answers || [];
        console.log('Quiz details:', { questionsCount: questions.length, userAnswersCount: userAnswers.length });
        if (!questions.length) {
          alert('No questions found in this quiz. Please try again.');
          return;
        }
        navigate('/results', { state: { questions, userAnswers, quizId: quiz.id, domain: quiz.domain, sub_domain: quiz.sub_domain || quiz.subDomain } });
        return;
      }

      // For incomplete quizzes, try resume flow
      const payload = { quiz_id: quiz.id };
      if (quiz.domain) payload.domain = quiz.domain;
      if (quiz.sub_domain) payload.sub_domain = quiz.sub_domain;
      if (quiz.subDomain) payload.sub_domain = payload.sub_domain || quiz.subDomain;

      const r = await authFetch('/resume-quiz/', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (r.status === 405) {
        const getResp = await authFetch(`/resume-quiz/?quiz_id=${quiz.id}`);
        if (!getResp.ok) {
          const err = await getResp.text();
          alert('Failed to fetch quiz: ' + err);
          return;
        }
        const d = await getResp.json();
        if (d) {
          const questions = d.questions || d.question_list || [];
          const resumeIndex = d.current_index || d.resume_index || 0;
          const userAnswers = d.userAnswers || d.user_answers || [];
          navigate('/quiz', { state: { questions, resumeIndex, userAnswers, quizId: quiz.id } });
        }
        return;
      }

      if (!r.ok) {
        const bodyText = await r.text().catch(() => null);
        try {
          const parsed = JSON.parse(bodyText || '{}');
          const msg = parsed.message || parsed.detail || (typeof parsed === 'string' ? parsed : null);
          if (msg && String(msg).toLowerCase().includes('no incomplete')) {
            // Try to show completed data via mark-complete
            const mc = await authFetch(`/mark-complete/${quiz.id}/`);
            if (mc.ok) {
              const mcData = await mc.json().catch(() => null);
              if (mcData && (mcData.userAnswers || mcData.user_answers || mcData.questions)) {
                const questions = mcData.questions || mcData.question_list || [];
                const userAnswers = mcData.userAnswers || mcData.user_answers || [];
                navigate('/results', { state: { questions, userAnswers } });
                return;
              }
            }
          }
        } catch (e) {
          // ignore JSON parse errors
        }

        alert('Failed to fetch quiz: ' + (bodyText || r.status));
        return;
      }

      const data = await r.json();
      const questions = data.questions || data.question_list || [];
      const resumeIndex = data.current_index || data.resume_index || 0;
      const userAnswers = data.userAnswers || data.user_answers || [];
      navigate('/quiz', { state: { questions, resumeIndex, userAnswers, quizId: quiz.id } });
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
          <div style={{ display: 'inline-flex', gap: '0.5rem', background: '#f6f7fb', padding: '6px', borderRadius: '8px' }}>
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
              style={{
                padding: '6px 12px',
                border: '1px solid var(--primary-color)',
                background: filter === 'all' ? 'var(--primary-color)' : 'transparent',
                color: filter === 'all' ? '#fff' : 'var(--primary-color)',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              All
            </button>
            <button
              className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
              onClick={() => setFilter('completed')}
              style={{
                padding: '6px 12px',
                border: '1px solid var(--primary-color)',
                background: filter === 'completed' ? 'var(--primary-color)' : 'transparent',
                color: filter === 'completed' ? '#fff' : 'var(--primary-color)',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Completed
            </button>
            <button
              className={`filter-btn ${filter === 'incomplete' ? 'active' : ''}`}
              onClick={() => setFilter('incomplete')}
              style={{
                padding: '6px 12px',
                border: '1px solid var(--primary-color)',
                background: filter === 'incomplete' ? 'var(--primary-color)' : 'transparent',
                color: filter === 'incomplete' ? '#fff' : 'var(--primary-color)',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Incomplete
            </button>
          </div>
        </main>

        <div className="history-list">
          {loading && <p>Loading...</p>}
          {!loading && history.length === 0 && <p style={{ color: '#666' }}>No quizzes.</p>}
          {!loading && (() => {
            const filtered = history.filter(q => {
              if (filter === 'all') return true;
              const isCompleted = q.completed || (q.status && String(q.status).toLowerCase() === 'completed');
              return filter === 'completed' ? isCompleted : !isCompleted;
            });
            return filtered.map((quiz) => (
              quiz && (
                <div
                  key={quiz.id}
                  className={`history-card ${String(quiz.status || quiz.state || '').toLowerCase()}`}
                >
                  <h3>{(quiz.domain ? `${quiz.domain} - ${quiz.sub_domain || quiz.subDomain || ''}` : (quiz.title || quiz.name || `Quiz ${quiz.id}`)).trim()}</h3>
                  <p>Status: {quiz.status || quiz.state || (quiz.completed ? 'Completed' : 'Incomplete')}</p>
                  {quiz.score !== null && quiz.score !== undefined && <p>Score: {quiz.score}%</p>}
                  <div style={{ marginTop: '0.5rem' }}>
                    <button className="history-btn" onClick={() => openQuiz(quiz)}>
                      {quiz.completed || (quiz.status && quiz.status.toLowerCase() === 'completed') ? 'View' : 'Resume'}
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

