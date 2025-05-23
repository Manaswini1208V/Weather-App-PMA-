import React, { useState, useRef } from 'react';
import './App.css';
import WeatherSearch from './components/WeatherSearch';
import CurrentWeather from './components/CurrentWeather';
import Forecast from './components/Forecast';
import SearchHistory from './components/SearchHistory';

function App() {
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const searchHistoryRef = useRef(null);
  
  // Function to refresh history
  const refreshHistory = () => {
    if (searchHistoryRef.current) {
      searchHistoryRef.current.refreshHistory();
    }
  };

  const fetchWeather = async (searchParams) => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching weather with params:", searchParams);
      
      // Use direct URLs instead of relying on proxy
      const baseUrl = 'http://localhost:12345';
      
      // Fetch current weather
      const weatherRes = await fetch(`${baseUrl}/api/weather?${new URLSearchParams(searchParams)}`);
      
      if (!weatherRes.ok) {
        const errorData = await weatherRes.json().catch(() => ({
          error: `Server error: ${weatherRes.status} ${weatherRes.statusText}`
        }));
        throw new Error(errorData.error || `Failed to fetch weather data: ${weatherRes.status}`);
      }
      
      const weatherJson = await weatherRes.json();
      setWeatherData(weatherJson);
      setLocation(searchParams.q || `${searchParams.lat},${searchParams.lon}` || searchParams.zip);
      
      // Fetch forecast
      const forecastRes = await fetch(`${baseUrl}/api/forecast?${new URLSearchParams(searchParams)}`);
      
      if (!forecastRes.ok) {
        const errorData = await forecastRes.json().catch(() => ({
          error: `Server error: ${forecastRes.status} ${forecastRes.statusText}`
        }));
        throw new Error(errorData.error || `Failed to fetch forecast data: ${forecastRes.status}`);
      }
      
      const forecastJson = await forecastRes.json();
      setForecastData(forecastJson);
      
      // Refresh history after successful search
      refreshHistory();
    } catch (err) {
      console.error('Error fetching weather:', err);
      
      if (err.message.includes('401')) {
        setError('API key error: Please ensure a valid OpenWeather API key is configured on the server');
      } else if (err.message.includes('Proxy')) {
        setError('Connection error: Unable to connect to the backend server');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleInfoModal = () => {
    setShowInfoModal(!showInfoModal);
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <h1>Weather App</h1>
          <div className="author-name">by Manaswini Vodnala</div>
        </div>
        <div className="header-actions">
          <button 
            className="info-button"
            onClick={toggleInfoModal}
            aria-label="Information"
          >
            <span className="info-icon">ℹ️</span>
          </button>
          <button 
            className="history-toggle" 
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? 'Hide Search History' : 'Show Search History'}
          </button>
        </div>
      </header>

      <main className="app-main">
        <WeatherSearch onSearch={fetchWeather} />
        
        {error && <div className="error">{error}</div>}
        
        {loading ? (
          <div className="loading">Loading weather data...</div>
        ) : (
          <>
            {weatherData && <CurrentWeather data={weatherData} location={location} />}
            {forecastData && <Forecast data={forecastData} />}
          </>
        )}
        
        {showHistory && <SearchHistory ref={searchHistoryRef} />}
      </main>
      
      {showInfoModal && (
        <div className="modal-overlay" onClick={toggleInfoModal}>
          <div className="info-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={toggleInfoModal}>&times;</button>
            <h2>About PM Accelerator</h2>
            <div className="modal-content">
              <p>
                The Product Manager Accelerator (PMA) is a leading program that helps professionals 
                accelerate their careers in product management. We provide comprehensive training, 
                mentorship, and resources to build the skills needed for success in the dynamic 
                field of product management.
              </p>
              <p>
                Visit our <a href="https://www.linkedin.com/company/product-manager-accelerator/" 
                target="_blank" rel="noopener noreferrer">LinkedIn page</a> to learn more about our 
                mission and programs.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <footer className="app-footer">
        <p>Weather data provided by OpenWeatherMap</p>
      </footer>
    </div>
  );
}

export default App; 