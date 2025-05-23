import React, { useState } from 'react';
import './WeatherSearch.css';

const WeatherSearch = ({ onSearch }) => {
  const [searchType, setSearchType] = useState('city');
  const [cityName, setCityName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [coordinates, setCoordinates] = useState({ lat: '', lon: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    let searchParams = {};
    
    switch (searchType) {
      case 'city':
        if (!cityName.trim()) {
          setError('Please enter a city name');
          return;
        }
        searchParams = { q: cityName.trim() };
        break;
        
      case 'zip':
        if (!zipCode.trim()) {
          setError('Please enter a zip code');
          return;
        }
        searchParams = { zip: zipCode.trim() };
        break;
        
      case 'coordinates':
        if (!coordinates.lat || !coordinates.lon) {
          setError('Please enter both latitude and longitude');
          return;
        }
        searchParams = { lat: coordinates.lat, lon: coordinates.lon };
        break;
        
      default:
        return;
    }
    
    onSearch(searchParams);
  };

  const handleGetCurrentLocation = () => {
    setError('');
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setSearchType('coordinates');
          setCoordinates({ lat: latitude.toFixed(6), lon: longitude.toFixed(6) });
          onSearch({ lat: latitude.toFixed(6), lon: longitude.toFixed(6) });
        },
        (err) => {
          setError(`Error getting location: ${err.message}`);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser');
    }
  };

  return (
    <div className="weather-search">
      <div className="search-options">
        <button 
          className={`search-option ${searchType === 'city' ? 'active' : ''}`}
          onClick={() => setSearchType('city')}
        >
          City
        </button>
        <button 
          className={`search-option ${searchType === 'zip' ? 'active' : ''}`}
          onClick={() => setSearchType('zip')}
        >
          Zip Code
        </button>
        <button 
          className={`search-option ${searchType === 'coordinates' ? 'active' : ''}`}
          onClick={() => setSearchType('coordinates')}
        >
          Coordinates
        </button>
        <button 
          className="search-option get-location"
          onClick={handleGetCurrentLocation}
        >
          My Location
        </button>
      </div>

      <form onSubmit={handleSubmit} className="search-form">
        {searchType === 'city' && (
          <div className="form-group">
            <label htmlFor="city">City Name:</label>
            <input
              type="text"
              id="city"
              value={cityName}
              onChange={(e) => setCityName(e.target.value)}
              placeholder="Enter city name (e.g. New York, London)"
            />
          </div>
        )}
        
        {searchType === 'zip' && (
          <div className="form-group">
            <label htmlFor="zip">Zip Code:</label>
            <input
              type="text"
              id="zip"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              placeholder="Enter zip code (e.g. 10001)"
            />
          </div>
        )}
        
        {searchType === 'coordinates' && (
          <div className="form-group coordinates">
            <div>
              <label htmlFor="lat">Latitude:</label>
              <input
                type="text"
                id="lat"
                value={coordinates.lat}
                onChange={(e) => setCoordinates({ ...coordinates, lat: e.target.value })}
                placeholder="Enter latitude (e.g. 40.7128)"
              />
            </div>
            <div>
              <label htmlFor="lon">Longitude:</label>
              <input
                type="text"
                id="lon"
                value={coordinates.lon}
                onChange={(e) => setCoordinates({ ...coordinates, lon: e.target.value })}
                placeholder="Enter longitude (e.g. -74.0060)"
              />
            </div>
          </div>
        )}
        
        {error && <div className="search-error">{error}</div>}
        
        <button type="submit" className="search-button">
          Get Weather
        </button>
      </form>
    </div>
  );
};

export default WeatherSearch; 