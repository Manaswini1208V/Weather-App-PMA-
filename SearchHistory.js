import React, { useState, useEffect, useImperativeHandle } from 'react';
import './SearchHistory.css';

const SearchHistory = React.forwardRef((props, ref) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Expose refreshHistory function to parent components
  useImperativeHandle(ref, () => ({
    refreshHistory: fetchHistory
  }));

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const baseUrl = 'http://localhost:12345';
      console.log('Fetching search history...');
      const response = await fetch(`${baseUrl}/api/history`);
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Failed to fetch search history: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Received ${data.length} history items`);
      setHistory(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const baseUrl = 'http://localhost:12345';
      const response = await fetch(`${baseUrl}/api/history/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete history item');
      }
      
      // Remove the deleted item from state
      setHistory(history.filter(item => item._id !== id));
    } catch (err) {
      setError(err.message);
      console.error('Error deleting history item:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading && history.length === 0) {
    return <div className="search-history loading">Loading search history...</div>;
  }

  if (error) {
    return (
      <div className="search-history error">
        <div>{error}</div>
        <button onClick={fetchHistory} className="retry-button">Retry</button>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="search-history empty">
        <p>No search history found.</p>
        <p className="hint">Search for a location to see it appear here!</p>
      </div>
    );
  }

  return (
    <div className="search-history">
      <div className="search-history-header">
        <h3>Recent Searches</h3>
        <button onClick={fetchHistory} className="refresh-button">
          Refresh
        </button>
      </div>
      
      <div className="history-list">
        {history.map(item => (
          <div key={item._id} className="history-item">
            <div className="history-content">
              <div className="history-location">
                <strong>{item.location}</strong>
                <span className="search-type">({item.searchType})</span>
              </div>
              <div className="history-time">{formatDate(item.timestamp)}</div>
            </div>
            <button 
              className="delete-button"
              onClick={() => handleDelete(item._id)}
              aria-label="Delete search history item"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </div>
  );
});

export default SearchHistory; 