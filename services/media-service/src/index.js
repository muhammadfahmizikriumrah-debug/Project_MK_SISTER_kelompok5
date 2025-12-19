require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./models');
const mediaRoutes = require('./routes/media.routes');
const { errorHandler } = require('./middleware/errorHandler');
const { initMinIO } = require('./utils/minio');

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'media-service',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/media', mediaRoutes);

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized.');
    
    // Initialize MinIO
    await initMinIO();
    console.log('✅ MinIO initialized successfully.');
    
    app.listen(PORT, () => {
      console.log(`🚀 Media Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
