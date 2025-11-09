import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/auth';
import Navbar from '../components/Navbar';

function Quiz() {
  const location = useLocation();
  const navigate = useNavigate();

  // 🧠 Pull quiz data from History or Generate page
  const questions = location.state?.questions || [];
  const quizId = location.state?.quizId || location.state?.quiz_id || null;
  const resumeIndex = location.state?.resumeIndex ?? location.state?.current_question_index ?? 0;
  const initialUserAnswers = location.state?.userAnswers || location.state?.user_answers || [];

  const [currentQuestion, setCurrentQuestion] = useState(resumeIndex);
  const [userAnswers, setUserAnswers] = useState(initialUserAnswers);
  const [selectedAnswers, setSelectedAnswers] = useState(initialUserAnswers[resumeIndex] || []);

  // ✅ Sync selected answers when changing question
  useEffect(() => {
    setSelectedAnswers(userAnswers[currentQuestion] || []);
  }, [currentQuestion, userAnswers]);

  // ✅ Auto-save progress to backend
  useEffect(() => {
    if (!quizId) return;
    const saveProgress = async () => {
      try {
        await authFetch(`/save-progress/${quizId}/`, {
          method: 'POST',
          body: JSON.stringify({
            user_answers: userAnswers,
            current_question_index: currentQuestion,
          }),
        });
      } catch (err) {
        console.warn('Progress save failed:', err);
      }
    };

    const timeout = setTimeout(saveProgress, 700);
    return () => clearTimeout(timeout);
  }, [quizId, userAnswers, currentQuestion]);

  if (!questions.length) {
    return (
      <div className="home">
        <Navbar />
        <div className="quiz-container">
          <div className="error-card">
            <h2>No Questions Available</h2>
            <p>Please go back and generate a new quiz.</p>
            <button onClick={() => navigate('/home')} className="back-btn">
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const isMultipleChoice =
    currentQ?.correct_answers &&
    Array.isArray(currentQ.correct_answers) &&
    currentQ.correct_answers.length > 1;

  const handleAnswerSelect = (answer) => {
    let newSelected;
    if (isMultipleChoice) {
      newSelected = selectedAnswers.includes(answer)
        ? selectedAnswers.filter((a) => a !== answer)
        : [...selectedAnswers, answer];
    } else {
      newSelected = [answer];
    }
    setSelectedAnswers(newSelected);

    // ✅ Update userAnswers instantly for saving
    const updatedAnswers = [...userAnswers];
    updatedAnswers[currentQuestion] = newSelected;
    setUserAnswers(updatedAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      finishQuiz();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const finishQuiz = async () => {
    try {
      if (quizId) {
        const res = await authFetch(`/mark-complete/${quizId}/`, {
          method: 'POST',
          body: JSON.stringify({ user_answers: userAnswers }),
        });
        if (res.ok) {
          const data = await res.json();
          navigate('/results', {
            state: {
              questions: data.questions || questions,
              userAnswers: data.user_answers || userAnswers,
              score: data.score,
            },
          });
          return;
        }
      }
      navigate('/results', { state: { questions, userAnswers } });
    } catch (err) {
      console.error('Error finishing quiz:', err);
      navigate('/results', { state: { questions, userAnswers } });
    }
  };

  return (
    <div className="home">
      <Navbar />
      <div className="quiz-container">
        <div className="quiz-card">
          <div className="quiz-header">
            <div className="question-meta">
              <h2>
                Question {currentQuestion + 1} of {questions.length}
              </h2>
              <span
                className={`question-type-badge ${
                  isMultipleChoice ? 'multiple' : 'single'
                }`}
              >
                {isMultipleChoice ? 'Multiple Correct' : 'Single Correct'}
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${((currentQuestion + 1) / questions.length) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="question-section">
            <h3 className="question-text">
              {currentQ?.question || 'Question not available'}
            </h3>

            <div className="options-list">
              {currentQ?.options?.length ? (
                currentQ.options.map((option, index) => (
                  <div
                    key={index}
                    className={`option-item ${
                      selectedAnswers.includes(option) ? 'selected' : ''
                    }`}
                    onClick={() => handleAnswerSelect(option)}
                  >
                    <div className="option-input">
                      {isMultipleChoice ? (
                        <input
                          type="checkbox"
                          checked={selectedAnswers.includes(option)}
                          onChange={() => handleAnswerSelect(option)}
                        />
                      ) : (
                        <input
                          type="radio"
                          checked={selectedAnswers.includes(option)}
                          onChange={() => handleAnswerSelect(option)}
                        />
                      )}
                    </div>
                    <span className="option-text">{option}</span>
                  </div>
                ))
              ) : (
                <div className="error-message" style={{ color: '#e74c3c' }}>
                  No options available for this question.
                </div>
              )}
            </div>

            {isMultipleChoice && (
              <div className="multiple-choice-hint">
                💡 This question has multiple correct answers.
              </div>
            )}
          </div>

          <div className="navigation-buttons">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="nav-btn prev-btn"
            >
              ← Previous
            </button>

            <div className="selected-count">
              {selectedAnswers.length} selected
            </div>

            <button
              onClick={handleNext}
              disabled={selectedAnswers.length === 0}
              className="nav-btn next-btn"
            >
              {currentQuestion < questions.length - 1 ? 'Next →' : 'Finish Quiz'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Quiz;
