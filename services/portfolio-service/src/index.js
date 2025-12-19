require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./models');
const portfolioRoutes = require('./routes/portfolio.routes');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3004;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Disable ETag to prevent 304 responses
app.disable('etag');

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'portfolio-service',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/portfolios', portfolioRoutes);

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized.');
    
    app.listen(PORT, () => {
      console.log(`🚀 Portfolio Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
