import React from 'react';
import './CurrentWeather.css';

const CurrentWeather = ({ data, location }) => {
  if (!data || !data.main) return null;

  const { 
    main: { temp, feels_like, temp_min, temp_max, humidity, pressure },
    weather,
    wind,
    sys,
    name,
    visibility,
    dt
  } = data;

  const weatherIcon = weather && weather[0] ? 
    `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png` : null;
  
  const weatherDescription = weather && weather[0] ? 
    weather[0].description : 'Unknown weather';
  
  // Convert timestamp to readable date/time
  const date = new Date(dt * 1000);
  const dateOptions = { 
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  
  const formattedDate = date.toLocaleDateString(undefined, dateOptions);
  
  // Convert meters to miles for visibility
  const visibilityInMiles = (visibility / 1609).toFixed(1);
  
  // Convert wind speed from m/s to mph if needed
  const windSpeedMph = (wind.speed * 2.237).toFixed(1);
  
  // Convert wind direction to cardinal direction
  const getWindDirection = (degrees) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                        'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N'];
    const index = Math.round(degrees % 360 / 22.5);
    return directions[index];
  };
  
  const windDirection = getWindDirection(wind.deg);
  
  return (
    <div className="current-weather">
      <div className="weather-header">
        <div>
          <h2>{name || location}</h2>
          <p className="date">{formattedDate}</p>
          <p className="description">
            {weatherIcon && <img src={weatherIcon} alt={weatherDescription} />}
            {weatherDescription.charAt(0).toUpperCase() + weatherDescription.slice(1)}
          </p>
        </div>
        <div className="temperature">
          <span className="temp-value">{Math.round(temp)}°C</span>
          <span className="feels-like">Feels like: {Math.round(feels_like)}°C</span>
        </div>
      </div>
      
      <div className="weather-details">
        <div className="detail-item">
          <span className="detail-label">High / Low</span>
          <span className="detail-value">{Math.round(temp_max)}°C / {Math.round(temp_min)}°C</span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">Humidity</span>
          <span className="detail-value">{humidity}%</span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">Wind</span>
          <span className="detail-value">{windSpeedMph} mph {windDirection}</span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">Pressure</span>
          <span className="detail-value">{pressure} hPa</span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">Visibility</span>
          <span className="detail-value">{visibilityInMiles} miles</span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">Sunrise</span>
          <span className="detail-value">
            {new Date(sys.sunrise * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <div className="detail-item">
          <span className="detail-label">Sunset</span>
          <span className="detail-value">
            {new Date(sys.sunset * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CurrentWeather; 