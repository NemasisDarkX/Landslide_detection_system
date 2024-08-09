const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

// Constants for the calculation
const WATER_ABSORPTION_FACTOR = 0.7;
const CRITICAL_SOIL_MOISTURE_LEVEL = 50;

// Sample soil moisture storage (in practice, use a database)
let soilMoistureData = {};

// Route to update soil moisture data
app.get('/update', async (req, res) => {
  const moisture = parseInt(req.query.moisture);
  const timestamp = new Date().toISOString();
  
  // Store the received soil moisture value
  soilMoistureData[timestamp] = moisture;

  // Fetch weather data and calculate the risk
  const riskMessage = await calculateLandslideRisk(moisture);
  
  res.send(`Received soil moisture: ${moisture}. ${riskMessage}`);
});

// Function to calculate landslide risk
async function calculateLandslideRisk(currentMoistureLevel) {
  try {
    const weatherData = await getWeatherData();
    const predictedRainfall = weatherData?.rain?.['3h'] || 0;

    const predictedMoistureIncrease = predictedRainfall * WATER_ABSORPTION_FACTOR;
    const predictedSoilMoisture = currentMoistureLevel + predictedMoistureIncrease;

    if (predictedSoilMoisture > CRITICAL_SOIL_MOISTURE_LEVEL) {
      return "High landslide risk! Take action.";
    } else {
      return "Landslide risk is low.";
    }

  } catch (error) {
    console.error("Error calculating landslide risk:", error);
    return "Error in calculating landslide risk.";
  }
}

// Function to fetch weather data
async function getWeatherData() {
  const WEATHER_API_KEY = 'a207d767ca4146fb96f184814240908';
  const LATITUDE = '9.198557';
  const LONGITUDE = '76.521907';
  const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${LATITUDE}&lon=${LONGITUDE}&appid=${WEATHER_API_KEY}`;
  const response = await axios.get(weatherUrl);
  return response.data.list[0];
}

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}/`);
});
