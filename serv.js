const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb+srv://stdevilkin666:b6zdq8a0L03WOQ63@cluster0-0.0f4ot.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0-0', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Define a schema and model for soil moisture data
const soilMoistureSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  moisture: Number
});

const SoilMoisture = mongoose.model('SoilMoisture', soilMoistureSchema);

// Root route to display the current readings
app.get('/', async (req, res) => {
  try {
    // Fetch the latest soil moisture reading from the database
    const latestReading = await SoilMoisture.findOne().sort({ timestamp: -1 });

    if (latestReading) {
      res.send(`Welcome to the Landslide Detection System API.<br><br>
        <b>Latest Soil Moisture Reading:</b><br>
        Moisture Level: ${latestReading.moisture}%<br>
        Timestamp: ${latestReading.timestamp}<br><br>
        Use /update?moisture=<value> to update soil moisture data.`);
    } else {
      res.send(`Welcome to the Landslide Detection System API.<br><br>
        <b>No soil moisture data available yet.</b><br>
        Use /update?moisture=<value> to add the first data.`);
    }
  } catch (error) {
    res.status(500).send('Error fetching data from the database.');
  }
});

// Route to update soil moisture data
app.get('/update', async (req, res) => {
  const moisture = parseInt(req.query.moisture);
  const timestamp = new Date();

  // Save the received soil moisture value to the database
  const moistureEntry = new SoilMoisture({ moisture });
  await moistureEntry.save();

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
