import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authFetch } from '../utils/auth';
import Navbar from '../components/Navbar';


function Quiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const questions = location.state?.questions || [];
  const resumeIndex = location.state?.resumeIndex || location.state?.resumeAt || 0;
  const initialUserAnswers = location.state?.userAnswers || location.state?.user_answers || [];
  const [currentQuestion, setCurrentQuestion] = useState(resumeIndex || 0);
  const [userAnswers, setUserAnswers] = useState(initialUserAnswers || []);
  const [selectedAnswers, setSelectedAnswers] = useState(userAnswers[currentQuestion] || []);

  // Keep selected answers in sync when currentQuestion or userAnswers change
  useEffect(() => {
    setSelectedAnswers(userAnswers[currentQuestion] || []);
  }, [currentQuestion, userAnswers]);

  // Handle case when no questions are passed
  if (questions.length === 0) {
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

  // Safety check for current question
  if (currentQuestion < 0 || currentQuestion >= questions.length) {
    return (
      <div className="home">
        <Navbar />
        <div className="quiz-container">
          <div className="error-card">
            <h2>Invalid Question Index</h2>
            <p>Please go back and start a new quiz.</p>
            <button onClick={() => navigate('/home')} className="back-btn">
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  if (!currentQ) {
    return (
      <div className="home">
        <Navbar />
        <div className="quiz-container">
          <div className="error-card">
            <h2>Question Not Found</h2>
            <p>Please go back and start a new quiz.</p>
            <button onClick={() => navigate('/home')} className="back-btn">
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isMultipleChoice =
    currentQ.correct_answers && currentQ.correct_answers.length > 1;

  // Handle option selection
  const handleAnswerSelect = (answer) => {
    if (isMultipleChoice) {
      // Toggle for multiple-choice
      const newSelected = selectedAnswers.includes(answer)
        ? selectedAnswers.filter((a) => a !== answer)
        : [...selectedAnswers, answer];
      setSelectedAnswers(newSelected);
    } else {
      // Single choice: select one only
      setSelectedAnswers([answer]);
    }
  };

  // Check if option is already selected
  const isAnswerSelected = (answer) => {
    return selectedAnswers.includes(answer);
  };

  // Go to next question or finish
  const handleNext = () => {
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = selectedAnswers;
    setUserAnswers(newAnswers);
    setSelectedAnswers([]);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      const nextAnswers = newAnswers[currentQuestion + 1] || [];
      setSelectedAnswers(nextAnswers);
    } else {
      // ✅ Finished — mark complete on backend if quizId is present, then go to results
      (async () => {
        try {
          const quizId = location.state?.quizId || location.state?.quiz_id || null;
          if (quizId) {
            try {
              const markResp = await authFetch(`/mark-complete/${quizId}/`, {
                method: 'POST',
                body: JSON.stringify({ user_answers: newAnswers }),
              });

              if (markResp.ok) {
                // If backend returns stored result or canonical user answers, use them
                const markData = await markResp.json().catch(() => null);
                if (markData && (markData.questions || markData.userAnswers || markData.user_answers)) {
                  const questionsFromServer = markData.questions || markData.question_list || questions;
                  const userAnswersFromServer = markData.userAnswers || markData.user_answers || newAnswers;
                  navigate('/results', { state: { questions: questionsFromServer, userAnswers: userAnswersFromServer } });
                  return;
                }
              } else {
                console.warn('mark-complete failed', markResp.status);
              }
            } catch (err) {
              console.error('Error calling mark-complete:', err);
            }
          }

          // Fallback: navigate with local data
          navigate('/results', { state: { questions: questions, userAnswers: newAnswers } });
        } catch (err) {
          console.error('Error finishing quiz:', err);
          navigate('/results', { state: { questions: questions, userAnswers: newAnswers } });
        }
      })();
    }
  };

  // Go back to previous question
  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      const prevAnswers = userAnswers[currentQuestion - 1] || [];
      setSelectedAnswers(prevAnswers);
    }
  };

  const isNextDisabled = () => selectedAnswers.length === 0;

  return (
    <div className="home">
      <Navbar />
      <div className="quiz-container">
        <div className="quiz-card">
        {/* Header with progress bar */}
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

        {/* Question Section */}
        <div className="question-section">
          <h3 className="question-text">{currentQ.question || 'Question not available'}</h3>

          <div className="options-list">
            {currentQ.options && Array.isArray(currentQ.options) && currentQ.options.length > 0 ? (
              currentQ.options.map((option, index) => (
              <div
                key={index}
                className={`option-item ${
                  isAnswerSelected(option) ? 'selected' : ''
                }`}
                onClick={() => handleAnswerSelect(option)}
              >
                <div className="option-input">
                  {isMultipleChoice ? (
                    <input
                      type="checkbox"
                      checked={isAnswerSelected(option)}
                      onChange={() => handleAnswerSelect(option)}
                    />
                  ) : (
                    <input
                      type="radio"
                      checked={isAnswerSelected(option)}
                      onChange={() => handleAnswerSelect(option)}
                    />
                  )}
                </div>
                <span className="option-text">{option}</span>
              </div>
            ))
            ) : (
              <div className="error-message" style={{ padding: '1rem', color: '#e74c3c' }}>
                No options available for this question.
              </div>
            )}
          </div>

          {isMultipleChoice && (
            <div className="multiple-choice-hint">
              💡 This question has multiple correct answers. Select all that
              apply.
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
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
            disabled={isNextDisabled()}
            className="nav-btn next-btn"
          >
            {currentQuestion < questions.length - 1
              ? 'Next →'
              : 'Finish Quiz'}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}

export default Quiz;
