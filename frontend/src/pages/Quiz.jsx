import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
// import '.Quiz.css'; // optional if you have styles

function Quiz() {
  const location = useLocation();
  const navigate = useNavigate();
  const questions = location.state?.questions || [];
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [selectedAnswers, setSelectedAnswers] = useState([]);

  // Handle case when no questions are passed
  if (questions.length === 0) {
    return (
      <div className="quiz-container">
        <div className="error-card">
          <h2>No Questions Available</h2>
          <p>Please go back and generate a new quiz.</p>
          <button onClick={() => navigate('/')} className="back-btn">
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const isMultipleChoice =
    currentQ.correct_answers && currentQ.correct_answers.length > 1; // ✅ auto-detect

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
      // ✅ Finished — go to results
      navigate('/results', {
        state: {
          questions: questions,
          userAnswers: newAnswers,
        },
      });
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
          <h3 className="question-text">{currentQ.question}</h3>

          <div className="options-list">
            {currentQ.options.map((option, index) => (
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
            ))}
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
  );
}

export default Quiz;
