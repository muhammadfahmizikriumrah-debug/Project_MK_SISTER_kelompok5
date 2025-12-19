require('dotenv').config();
const amqp = require('amqplib');
const { processMedia } = require('./workers/thumbnailWorker');
const { sequelize } = require('./models');

const THUMBNAIL_QUEUE = 'thumbnail_generation';

async function startWorker() {
  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');

    // Connect to RabbitMQ
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await connection.createChannel();

    await channel.assertQueue(THUMBNAIL_QUEUE, { durable: true });
    
    // Set prefetch to 1 - process one job at a time
    channel.prefetch(1);

    console.log('✅ Worker service started successfully');
    console.log(`🔄 Waiting for thumbnail generation jobs in queue: ${THUMBNAIL_QUEUE}`);

    // Consume messages
    channel.consume(THUMBNAIL_QUEUE, async (msg) => {
      if (msg !== null) {
        try {
          const job = JSON.parse(msg.content.toString());
          console.log(`📥 Received job for media ID: ${job.mediaId}`);

          // Process the media (generate thumbnail)
          await processMedia(job);

          // Acknowledge the message
          channel.ack(msg);
          console.log(`✅ Job completed for media ID: ${job.mediaId}`);
        } catch (error) {
          console.error('❌ Error processing job:', error);
          
          // Reject and requeue the message if it's a temporary error
          // Or reject without requeue if it's a permanent error
          if (error.permanent) {
            channel.reject(msg, false);
          } else {
            channel.reject(msg, true);
          }
        }
      }
    });

    // Handle connection close
    connection.on('close', () => {
      console.error('❌ RabbitMQ connection closed. Reconnecting...');
      setTimeout(startWorker, 5000);
    });

    connection.on('error', (err) => {
      console.error('❌ RabbitMQ connection error:', err);
    });

  } catch (error) {
    console.error('❌ Failed to start worker:', error);
    setTimeout(startWorker, 5000);
  }
}

// Start the worker
startWorker();
