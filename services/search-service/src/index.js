require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const searchRoutes = require('./routes/search.routes');
const { errorHandler } = require('./middleware/errorHandler');
const { initMeilisearch } = require('./utils/meilisearch');
const { startSearchWorker } = require('./workers/searchWorker');

const app = express();
const PORT = process.env.PORT || 3006;

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
    service: 'search-service',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/search', searchRoutes);

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Initialize Meilisearch
    await initMeilisearch();
    console.log('✅ Meilisearch initialized successfully.');
    
    // Start search worker for RabbitMQ
    startSearchWorker();
    console.log('✅ Search worker started successfully.');
    
    app.listen(PORT, () => {
      console.log(`🚀 Search Service running on port ${PORT}`);
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
