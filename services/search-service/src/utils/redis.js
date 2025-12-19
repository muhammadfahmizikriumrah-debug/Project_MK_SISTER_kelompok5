const redis = require('redis');

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = redis.createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => {
      console.error('Redis Client Error:', err);
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });

    await redisClient.connect();
  } catch (error) {
    console.error('❌ Redis connection error:', error);
    // Continue without Redis if connection fails
    redisClient = createMockRedisClient();
  }
};

// Mock Redis client for fallback
const createMockRedisClient = () => ({
  get: async () => null,
  setEx: async () => 'OK',
  del: async () => 1,
  connect: async () => {},
  quit: async () => {}
});

// Initialize Redis connection
connectRedis();

module.exports = redisClient || createMockRedisClient();
