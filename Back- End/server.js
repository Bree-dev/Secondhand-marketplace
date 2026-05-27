const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import the Master Router package
const apiRoutes = require('./routes/index');

const app = express();

// Global configurations
app.use(cors());
app.use(express.json());

// Pass all API routing responsibilities down to the routes folder
app.use('/api', apiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Marketplace server running dynamically on port ${PORT}`);
}); 
