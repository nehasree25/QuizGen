import React from 'react';
import Navbar from '../components/Navbar';

const History = () => {
  return (
    <div style={styles.container}>
      <Navbar />
      
      <div style={styles.content}>
        <div style={styles.header}>
          <h1 style={styles.title}>Quiz History</h1>
        </div>

        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📊</div>
          <h3 style={styles.emptyTitle}>No Quiz History</h3>
          <p style={styles.emptyText}>
            You haven't taken any quizzes yet. Start your first quiz to see your history here!
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f0faff',
  },
  content: {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '2rem',
  },
  title: {
    color: '#256178',
    fontSize: '2.2rem',
    fontWeight: '700',
  },
  emptyState: {
    textAlign: 'center',
    padding: '4rem 2rem',
    background: '#ffffff',
    borderRadius: '15px',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
    border: '2px solid #e6f7ff',
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '1rem',
  },
  emptyTitle: {
    color: '#256178',
    fontSize: '1.5rem',
    marginBottom: '1rem',
    fontWeight: '600',
  },
  emptyText: {
    color: '#666',
    fontSize: '1rem',
    lineHeight: '1.6',
    maxWidth: '400px',
    margin: '0 auto',
  },
};

export default History;