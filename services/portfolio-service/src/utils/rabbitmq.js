const amqp = require('amqplib');

let channel = null;
const EXCHANGE_NAME = 'portfolio_events';
const SEARCH_QUEUE = 'search_indexing';

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    
    await channel.assertExchange(EXCHANGE_NAME, 'topic', { durable: true });
    await channel.assertQueue(SEARCH_QUEUE, { durable: true });
    await channel.bindQueue(SEARCH_QUEUE, EXCHANGE_NAME, 'portfolio.*');
    
    console.log('✅ RabbitMQ connected successfully');
  } catch (error) {
    console.error('❌ RabbitMQ connection error:', error.message);
    // Continue without RabbitMQ
    channel = null;
  }
}

async function publishToSearchIndex(data) {
  try {
    if (!channel) {
      await connectRabbitMQ();
    }

    if (channel) {
      const message = JSON.stringify(data);
      channel.publish(
        EXCHANGE_NAME,
        'portfolio.search',
        Buffer.from(message),
        { persistent: true }
      );
      console.log('📤 Published to search index:', data.action);
    }
  } catch (error) {
    console.error('Error publishing to RabbitMQ:', error.message);
  }
}

// Initialize connection
connectRabbitMQ();

module.exports = {
  publishToSearchIndex
};
