import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const { questions, userAnswers } = location.state || {};

  if (!questions || !userAnswers || !Array.isArray(questions) || questions.length === 0) {
    return (
      <div className="home">
        <Navbar />
        <div className="results-container">
          <div className="error-card">
            <h2>No Results Available</h2>
            <button onClick={() => navigate('/home')} className="back-btn">
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Order-insensitive, case-insensitive, accurate score calculation
  const normalize = (arr) =>
    (arr || []).map((a) => a.trim().toLowerCase()).sort();

  const calculateScore = () => {
    return questions.reduce((total, question, index) => {
      const userAnswer = normalize(userAnswers[index] || []);
      const correctAnswers = normalize(question.correct_answers || [question.correct_answer]);

      if (userAnswer.length === 0 || correctAnswers.length === 0) return total;

      if (JSON.stringify(userAnswer) === JSON.stringify(correctAnswers)) {
        return total + 1;
      }
      return total;
    }, 0);
  };

  const score = calculateScore();
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const isAnswerCorrect = (question, userAnswer) => {
    const normalizedUser = normalize(userAnswer);
    const normalizedCorrect = normalize(question.correct_answers || [question.correct_answer]);
    return JSON.stringify(normalizedUser) === JSON.stringify(normalizedCorrect);
  };

  const getAnswerStatus = (question, userAnswer) => {
    const correctAnswers = question.correct_answers || [question.correct_answer];
    const normalizedUser = normalize(userAnswer);
    const normalizedCorrect = normalize(correctAnswers);
    const isCorrect = JSON.stringify(normalizedUser) === JSON.stringify(normalizedCorrect);

    if (isCorrect) return 'perfect';
    if (userAnswer.length > 0 && userAnswer.some((a) => normalizedCorrect.includes(a.trim().toLowerCase()))) {
      return 'partial';
    }
    return 'incorrect';
  };

  return (
    <div className="home">
      <Navbar />
      <div className="results-container">
        <div className="results-card">
          <center><h1>Quiz Results</h1></center>

          <div className={`score-circle ${percentage >= 80 ? 'excellent' : percentage >= 60 ? 'good' : 'poor'}`}>
            <span>{percentage}%</span>
          </div>
          <p className="score-text">
            You got {score} out of {questions.length} questions correct!
          </p>

          <div className="questions-review">
            <h3>Detailed Review:</h3>

            {questions.map((question, index) => {
              const userAnswer = userAnswers[index] || [];
              const correctAnswers = question.correct_answers || [question.correct_answer];
              const answerStatus = getAnswerStatus(question, userAnswer);
              const isMultiple = question.question_type === 'multiple';

              return (
                <div key={index} className={`question-review ${answerStatus}`}>
                  <div className="question-header">
                    <strong>Question {index + 1}: {question.question}</strong>
                    {isMultiple && (
                      <span className="result-type-badge">Multiple Choice</span>
                    )}
                  </div>

                  <div className={`user-answer ${answerStatus}`}>
                    <strong>Your answer{isMultiple && 's'}:</strong>{' '}
                    {userAnswer.length > 0 ? userAnswer.join(', ') : 'Not answered'}
                    <span className="status-icon">
                      {answerStatus === 'perfect' && '✅'}
                      {answerStatus === 'partial' && '⚠️'}
                      {answerStatus === 'incorrect' && '❌'}
                    </span>
                  </div>

                  {answerStatus !== 'perfect' && (
                    <div className="correct-answer">
                      <strong>Correct answer{isMultiple && 's'}:</strong>{' '}
                      {correctAnswers.join(', ')}
                    </div>
                  )}

                  {answerStatus === 'partial' && (
                    <div className="partial-warning">
                      ⚠️ You selected some correct answers, but missed others or selected incorrect ones.
                    </div>
                  )}

                  <div className="explanation">
                    <strong>Explanation:</strong> {question.explanation || 'No explanation available.'}
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={() => navigate('/home')} className="new-quiz-btn">
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

export default Results;
