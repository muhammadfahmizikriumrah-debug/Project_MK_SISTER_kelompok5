const amqp = require('amqplib');

let channel = null;
const THUMBNAIL_QUEUE = 'thumbnail_generation';

async function connectRabbitMQ() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    channel = await connection.createChannel();
    
    await channel.assertQueue(THUMBNAIL_QUEUE, { durable: true });
    
    console.log('✅ RabbitMQ connected successfully');
  } catch (error) {
    console.error('❌ RabbitMQ connection error:', error.message);
    channel = null;
  }
}

async function publishThumbnailJob(data) {
  try {
    if (!channel) {
      await connectRabbitMQ();
    }

    if (channel) {
      const message = JSON.stringify(data);
      channel.sendToQueue(
        THUMBNAIL_QUEUE,
        Buffer.from(message),
        { persistent: true }
      );
      console.log('📤 Published thumbnail job for:', data.mediaId);
    }
  } catch (error) {
    console.error('Error publishing to RabbitMQ:', error.message);
  }
}

// Initialize connection
connectRabbitMQ();

module.exports = {
  publishThumbnailJob
};
