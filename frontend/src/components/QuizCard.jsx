import React from 'react';

const QuizCard = ({ quiz, onViewDetails }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#00c853';
    if (score >= 60) return '#ff9800';
    return '#f44336';
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h3 style={styles.quizTitle}>{quiz.domain} - {quiz.subDomain}</h3>
        <span 
          style={{
            ...styles.scoreBadge,
            backgroundColor: getScoreColor(quiz.score)
          }}
        >
          {quiz.score}%
        </span>
      </div>
      
      <div style={styles.cardBody}>
        <div style={styles.quizInfo}>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Difficulty:</span>
            <span style={styles.infoValue}>{quiz.level}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Questions:</span>
            <span style={styles.infoValue}>{quiz.totalQuestions}</span>
          </div>
          <div style={styles.infoItem}>
            <span style={styles.infoLabel}>Date:</span>
            <span style={styles.infoValue}>{formatDate(quiz.date)}</span>
          </div>
        </div>
        
        <div style={styles.timeInfo}>
          <span style={styles.timeText}>
            Time Taken: {quiz.timeTaken} minutes
          </span>
        </div>
      </div>
      
      <div style={styles.cardFooter}>
        <button 
          onClick={() => onViewDetails(quiz)}
          style={styles.viewButton}
        >
          View Details
        </button>
      </div>
    </div>
  );
};

const styles = {
  card: {
    background: '#ffffff',
    borderRadius: '12px',
    padding: '1.5rem',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e6f7ff',
    transition: 'all 0.3s ease',
  },
  cardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  quizTitle: {
    color: '#256178',
    fontSize: '1.2rem',
    fontWeight: '600',
    margin: 0,
    flex: 1,
  },
  scoreBadge: {
    color: 'white',
    padding: '0.3rem 0.8rem',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: '700',
    minWidth: '60px',
    textAlign: 'center',
  },
  cardBody: {
    marginBottom: '1.5rem',
  },
  quizInfo: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem',
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  infoLabel: {
    fontSize: '0.8rem',
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: '0.9rem',
    color: '#333',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  timeInfo: {
    padding: '0.8rem',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    textAlign: 'center',
  },
  timeText: {
    fontSize: '0.9rem',
    color: '#666',
    fontWeight: '500',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  viewButton: {
    padding: '0.6rem 1.2rem',
    backgroundColor: '#87ceeb',
    color: 'black',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
};

export default QuizCard;