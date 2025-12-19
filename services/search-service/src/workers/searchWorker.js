const amqp = require('amqplib');
const { indexPortfolio, deletePortfolio } = require('../utils/meilisearch');

const SEARCH_QUEUE = 'search_indexing';

async function startSearchWorker() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
    const channel = await connection.createChannel();

    await channel.assertQueue(SEARCH_QUEUE, { durable: true });
    channel.prefetch(1);

    console.log(`🔄 Search worker listening on queue: ${SEARCH_QUEUE}`);

    channel.consume(SEARCH_QUEUE, async (msg) => {
      if (msg !== null) {
        try {
          const job = JSON.parse(msg.content.toString());
          console.log(`📥 Received search job: ${job.action}`);

          switch (job.action) {
            case 'index':
            case 'update':
              await indexPortfolio(job.portfolio);
              break;
            case 'delete':
              await deletePortfolio(job.portfolioId);
              break;
            default:
              console.warn(`Unknown action: ${job.action}`);
          }

          channel.ack(msg);
          console.log(`✅ Search job completed: ${job.action}`);
        } catch (error) {
          console.error('❌ Error processing search job:', error);
          channel.reject(msg, false);
        }
      }
    });

    connection.on('close', () => {
      console.error('❌ RabbitMQ connection closed. Reconnecting...');
      setTimeout(startSearchWorker, 5000);
    });

  } catch (error) {
    console.error('❌ Failed to start search worker:', error);
    setTimeout(startSearchWorker, 5000);
  }
}

module.exports = {
  startSearchWorker
};
