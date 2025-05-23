import React from 'react';
import './Forecast.css';

const Forecast = ({ data }) => {
  if (!data || !data.list || data.list.length === 0) return null;

  // Group forecast data by day
  const groupedData = {};
  const today = new Date().setHours(0, 0, 0, 0);
  
  data.list.forEach(item => {
    const date = new Date(item.dt * 1000);
    const day = date.setHours(0, 0, 0, 0);
    
    // Skip today's data
    if (day === today) return;
    
    if (!groupedData[day]) {
      groupedData[day] = [];
    }
    
    groupedData[day].push(item);
  });

  // For each day, get min and max temp and most common weather condition
  const dailyData = Object.keys(groupedData).map(day => {
    const items = groupedData[day];
    const date = new Date(Number(day));
    
    // Get min and max temps
    let minTemp = items[0].main.temp_min;
    let maxTemp = items[0].main.temp_max;
    
    // Count weather conditions to determine the most common one
    const weatherCounts = {};
    
    items.forEach(item => {
      // Update min/max temps
      if (item.main.temp_min < minTemp) minTemp = item.main.temp_min;
      if (item.main.temp_max > maxTemp) maxTemp = item.main.temp_max;
      
      // Count weather conditions
      const weatherId = item.weather[0].id;
      if (!weatherCounts[weatherId]) weatherCounts[weatherId] = 0;
      weatherCounts[weatherId]++;
    });
    
    // Find most common weather condition
    let mostCommonWeatherId;
    let maxCount = 0;
    
    Object.entries(weatherCounts).forEach(([id, count]) => {
      if (count > maxCount) {
        mostCommonWeatherId = Number(id);
        maxCount = count;
      }
    });
    
    // Find the weather object with the most common id
    const mostCommonWeather = items.find(item => item.weather[0].id === mostCommonWeatherId).weather[0];
    
    return {
      date,
      minTemp,
      maxTemp,
      weather: mostCommonWeather
    };
  });

  // Sort by date
  dailyData.sort((a, b) => a.date - b.date);
  
  // Limit to 5 days
  const fiveDayData = dailyData.slice(0, 5);

  return (
    <div className="forecast">
      <h3>5-Day Forecast</h3>
      <div className="forecast-container">
        {fiveDayData.map((day, index) => {
          const date = day.date;
          const dayOfWeek = date.toLocaleDateString(undefined, { weekday: 'short' });
          const monthDay = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          const weatherIcon = `https://openweathermap.org/img/wn/${day.weather.icon}@2x.png`;

          return (
            <div key={index} className="forecast-day">
              <div className="forecast-date">
                <span className="day">{dayOfWeek}</span>
                <span className="date">{monthDay}</span>
              </div>
              
              <div className="forecast-icon">
                <img src={weatherIcon} alt={day.weather.description} />
                <span className="weather-desc">{day.weather.main}</span>
              </div>
              
              <div className="forecast-temps">
                <span className="high">{Math.round(day.maxTemp)}°</span>
                <span className="low">{Math.round(day.minTemp)}°</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Forecast; 