process.env.NODE_ENV = 'test';
process.env.MEILISEARCH_HOST = 'http://localhost:7700';
process.env.MEILISEARCH_KEY = 'test-key';
process.env.RABBITMQ_URL = 'amqp://localhost';
process.env.REDIS_URL = 'redis://localhost:6379';

const request = require('supertest');

jest.mock('../../src/utils/meilisearch', () => ({
  initMeilisearch: jest.fn().mockResolvedValue(),
  searchPortfolios: jest.fn(),
  indexPortfolio: jest.fn().mockResolvedValue(),
  deletePortfolio: jest.fn().mockResolvedValue(),
  getSuggestions: jest.fn().mockResolvedValue([]),
  client: {}
}));

jest.mock('../../src/utils/redis', () => ({
  get: jest.fn().mockResolvedValue(null),
  setEx: jest.fn().mockResolvedValue('OK'),
  del: jest.fn().mockResolvedValue(1)
}));

jest.mock('../../src/workers/searchWorker', () => ({
  startSearchWorker: jest.fn()
}));

const meili = require('../../src/utils/meilisearch');
const redisClient = require('../../src/utils/redis');
require('../../src/workers/searchWorker');

const app = require('../../src/index');

jest.setTimeout(20000);

beforeEach(() => {
  jest.clearAllMocks();
  redisClient.get.mockResolvedValue(null);
  meili.searchPortfolios.mockResolvedValue({
    hits: [
      {
        id: 'portfolio-1',
        title: 'AI Project',
        description: 'Deep learning research',
        tags: ['ai', 'research'],
        category: 'Technology',
        status: 'published',
        isPublic: true
      }
    ],
    totalHits: 1,
    processingTimeMs: 5,
    query: 'AI',
    limit: 20,
    offset: 0
  });
});

describe('Search Service - Indexing consistency', () => {
  it('indexes a portfolio via API and forwards to Meilisearch', async () => {
    const portfolioPayload = {
      id: 'portfolio-1',
      userId: 'user-100',
      title: 'AI Project',
      description: 'Deep learning research',
      tags: ['ai', 'research'],
      category: 'Technology',
      status: 'published',
      isPublic: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const response = await request(app)
      .post('/api/search/index')
      .send(portfolioPayload)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      message: 'Portfolio indexed successfully'
    });
    expect(meili.indexPortfolio).toHaveBeenCalledWith(portfolioPayload);
  });

  it('searches portfolios and caches the result', async () => {
    const firstResponse = await request(app)
      .get('/api/search/portfolios')
      .query({ q: 'AI' })
      .expect(200);

    expect(meili.searchPortfolios).toHaveBeenCalledWith('AI', expect.objectContaining({
      limit: 20,
      offset: 0
    }));
    expect(firstResponse.body).toMatchObject({
      success: true,
      data: expect.objectContaining({ totalHits: 1 })
    });
    expect(redisClient.setEx).toHaveBeenCalledWith(
      expect.stringContaining('"q":"AI"'),
      300,
      expect.any(String)
    );

    const cachedResult = JSON.stringify(firstResponse.body.data);
    redisClient.get.mockResolvedValueOnce(cachedResult);

    const secondResponse = await request(app)
      .get('/api/search/portfolios')
      .query({ q: 'AI' })
      .expect(200);

    expect(secondResponse.body).toMatchObject({
      success: true,
      data: JSON.parse(cachedResult),
      cached: true
    });
    expect(meili.searchPortfolios).toHaveBeenCalledTimes(1);
  });

  it('removes a portfolio from the index', async () => {
    const portfolioId = 'portfolio-1';

    const response = await request(app)
      .delete(`/api/search/index/${portfolioId}`)
      .expect(200);

    expect(response.body).toMatchObject({
      success: true,
      message: 'Portfolio removed from index'
    });
    expect(meili.deletePortfolio).toHaveBeenCalledWith(portfolioId);
  });
});
