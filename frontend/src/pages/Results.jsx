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

  const calculateScore = () => {
    return questions.reduce((total, question, index) => {
      const userAnswer = userAnswers[index] || [];
      const correctAnswers = question.correct_answers || [question.correct_answer];
      
      if (!correctAnswers || correctAnswers.length === 0) {
        return total;
      }
      
      if (question.question_type === 'single' || !question.question_type) {
        // Single choice or legacy format
        return total + (userAnswer[0] === correctAnswers[0] ? 1 : 0);
      } else {
        // Multiple choice - exact match required
        const userSet = new Set(userAnswer);
        const correctSet = new Set(correctAnswers);
        
        const isCorrect = 
          userAnswer.length === correctAnswers.length &&
          correctAnswers.every(answer => userSet.has(answer)) &&
          userAnswer.every(answer => correctSet.has(answer));
        
        return total + (isCorrect ? 1 : 0);
      }
    }, 0);
  };

  const score = calculateScore();
  const percentage = questions.length > 0 ? Math.round((score / questions.length) * 100) : 0;

  const isAnswerCorrect = (question, userAnswer) => {
    const correctAnswers = question.correct_answers || [question.correct_answer];
    
    if (!correctAnswers || correctAnswers.length === 0) {
      return false;
    }
    
    if (question.question_type === 'single' || !question.question_type) {
      return userAnswer[0] === correctAnswers[0];
    } else {
      const userSet = new Set(userAnswer);
      const correctSet = new Set(correctAnswers);
      
      return (
        userAnswer.length === correctAnswers.length &&
        correctAnswers.every(answer => userSet.has(answer)) &&
        userAnswer.every(answer => correctSet.has(answer))
      );
    }
  };

  const getAnswerStatus = (question, userAnswer) => {
    const correctAnswers = question.correct_answers || [question.correct_answer];
    const isCorrect = isAnswerCorrect(question, userAnswer);
    
    if (isCorrect) {
      return 'perfect';
    } else if (userAnswer.length > 0 && userAnswer.some(answer => correctAnswers.includes(answer))) {
      return 'partial';
    } else {
      return 'incorrect';
    }
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