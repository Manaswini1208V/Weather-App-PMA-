require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid'); // We'll generate IDs manually

const app = express();
const PORT = process.env.PORT || 12345;
const API_KEY = process.env.OPENWEATHER_API_KEY || '832f59ebb0cc784b3d1c441dbce3cbe6';

// In-memory storage for search history (since MongoDB isn't available)
let searchHistoryItems = [];

// Weather schema definition
const weatherSchema = new mongoose.Schema({
  location: String,
  searchType: String, // zip, city, coordinates, etc.
  timestamp: { type: Date, default: Date.now },
  weatherData: Object
});

let Weather;
let useDatabase = false;

// Try to connect to MongoDB but don't block app functionality if it fails
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      Weather = mongoose.model('Weather', weatherSchema);
      useDatabase = true;
    })
    .catch(err => {
      console.error('Could not connect to MongoDB:', err);
      console.log('App will run with in-memory storage');
    });
} else {
  console.log('No MongoDB URI provided. App will run with in-memory storage');
}

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Weather API server is running' });
});

app.get('/api/weather', async (req, res) => {
  try {
    const { q, lat, lon, zip } = req.query;
    let queryParams = {};
    
    // Define which parameter to use based on what was provided
    if (q) queryParams.q = q; // City name
    else if (lat && lon) {
      queryParams.lat = lat;
      queryParams.lon = lon;
    } else if (zip) {
      // Add country code for international zip codes
      // Format: zip=505001,in (505001 in India)
      // If no country code is provided, append ",in" for India
      if (!zip.includes(',')) {
        queryParams.zip = `${zip},in`;
        console.log(`Adding country code to zip: ${zip} -> ${queryParams.zip}`);
      } else {
        queryParams.zip = zip;
      }
    }
    else return res.status(400).json({ error: 'Missing location parameters' });
    
    // Add API key
    queryParams.appid = API_KEY;
    queryParams.units = 'metric';
    
    console.log('Making request to OpenWeather API with params:', { ...queryParams, appid: '[HIDDEN]' });
    
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: queryParams
    });
    
    // Save search to history (either database or in-memory)
    const searchType = q ? 'city' : (lat && lon ? 'coordinates' : 'zip');
    const locationString = q || `${lat},${lon}` || zip;
    
    if (useDatabase && Weather) {
      try {
        const search = new Weather({
          location: locationString,
          searchType,
          weatherData: response.data
        });
        
        await search.save();
      } catch (dbError) {
        console.error('Error saving to database:', dbError);
      }
    } else {
      // Use in-memory storage
      const historyItem = {
        _id: uuidv4(),
        location: locationString,
        searchType,
        timestamp: new Date(),
        weatherData: response.data
      };
      searchHistoryItems.unshift(historyItem); // Add to beginning of array
      // Keep only the last 10 items
      if (searchHistoryItems.length > 10) {
        searchHistoryItems = searchHistoryItems.slice(0, 10);
      }
      console.log(`Added search to history: ${locationString} (${searchType})`);
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('Weather API Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 5-day forecast endpoint
app.get('/api/forecast', async (req, res) => {
  try {
    const { q, lat, lon, zip } = req.query;
    let queryParams = {};
    
    if (q) queryParams.q = q;
    else if (lat && lon) {
      queryParams.lat = lat;
      queryParams.lon = lon;
    } else if (zip) {
      // Add country code for international zip codes
      // Format: zip=505001,in (505001 in India)
      // If no country code is provided, append ",in" for India
      if (!zip.includes(',')) {
        queryParams.zip = `${zip},in`;
        console.log(`Adding country code to zip: ${zip} -> ${queryParams.zip}`);
      } else {
        queryParams.zip = zip;
      }
    }
    else return res.status(400).json({ error: 'Missing location parameters' });
    
    // Use same API key handling as weather endpoint
    queryParams.appid = API_KEY;
    queryParams.units = 'metric';
    
    console.log('Making request to OpenWeather API forecast with params:', { ...queryParams, appid: '[HIDDEN]' });
    
    const response = await axios.get('https://api.openweathermap.org/data/2.5/forecast', {
      params: queryParams
    });
    
    // Save search to history if database is available
    if (useDatabase && Weather) {
      try {
        const searchType = q ? 'city' : (lat && lon ? 'coordinates' : 'zip');
        const search = new Weather({
          location: q || `${lat},${lon}` || zip,
          searchType,
          weatherData: response.data
        });
        
        await search.save();
      } catch (dbError) {
        console.error('Error saving to database:', dbError);
        // Continue with the response even if database save fails
      }
    }
    
    res.json(response.data);
  } catch (error) {
    console.error('Forecast API Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get search history
app.get('/api/history', async (req, res) => {
  if (useDatabase && Weather) {
    try {
      const history = await Weather.find().sort({ timestamp: -1 }).limit(10);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    // Return in-memory history
    console.log(`Returning ${searchHistoryItems.length} history items`);
    res.json(searchHistoryItems);
  }
});

// Delete search history item
app.delete('/api/history/:id', async (req, res) => {
  const { id } = req.params;
  
  if (useDatabase && Weather) {
    try {
      await Weather.findByIdAndDelete(id);
      res.json({ message: 'History item deleted' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  } else {
    // Delete from in-memory storage
    const initialLength = searchHistoryItems.length;
    searchHistoryItems = searchHistoryItems.filter(item => item._id !== id);
    
    if (searchHistoryItems.length < initialLength) {
      console.log(`Deleted history item: ${id}`);
      res.json({ message: 'History item deleted' });
    } else {
      res.status(404).json({ error: 'History item not found' });
    }
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access at http://localhost:${PORT}/`);
}); 