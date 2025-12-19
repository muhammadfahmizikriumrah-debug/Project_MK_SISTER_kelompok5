process.env.NODE_ENV = 'test';
process.env.TEST_DATABASE_URL = 'sqlite::memory:';
process.env.MINIO_BUCKET = 'test-media-bucket';
process.env.RABBITMQ_URL = 'amqp://localhost';

const request = require('supertest');
const path = require('path');

const mockUploadedObjectName = 'mock-image-object.png';
const mockFileUrl = `http://localhost:9000/${process.env.MINIO_BUCKET}/${mockUploadedObjectName}`;

jest.mock('../../src/utils/minio', () => ({
  uploadToMinIO: jest.fn().mockResolvedValue(mockUploadedObjectName),
  deleteFromMinIO: jest.fn().mockResolvedValue(),
  getFileUrl: jest.fn().mockResolvedValue(mockFileUrl),
  initMinIO: jest.fn().mockResolvedValue(),
  minioClient: {},
  BUCKET_NAME: process.env.MINIO_BUCKET
}));

jest.mock('../../src/utils/rabbitmq', () => ({
  publishThumbnailJob: jest.fn()
}));

const { publishThumbnailJob: publishThumbnailJobMock } = require('../../src/utils/rabbitmq');
publishThumbnailJobMock.mockResolvedValue();

const app = require('../../src/index');
const { Media, sequelize } = require('../../src/models');

jest.setTimeout(20000);

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterEach(async () => {
  publishThumbnailJobMock.mockClear();
  await Media.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Media Service - Asynchronous upload flow', () => {
  it('uploads an image, stores metadata, and enqueues thumbnail job', async () => {
    const imageBuffer = Buffer.from('fake image data');
    const userId = 'user-123';

    const response = await request(app)
      .post('/api/media/upload')
      .field('userId', userId)
      .attach('file', imageBuffer, {
        filename: 'profile.png',
        contentType: 'image/png'
      })
      .expect(201);

    expect(response.body).toMatchObject({
      success: true,
      data: expect.objectContaining({
        userId,
        filename: mockUploadedObjectName,
        url: mockFileUrl,
        type: 'image',
        status: 'processing'
      })
    });

    const createdRecord = await Media.findByPk(response.body.data.id);
    expect(createdRecord).not.toBeNull();
    expect(createdRecord.userId).toBe(userId);
    expect(createdRecord.filename).toBe(mockUploadedObjectName);
    expect(createdRecord.type).toBe('image');
    expect(createdRecord.status).toBe('processing');

    const minio = require('../../src/utils/minio');
    expect(minio.uploadToMinIO).toHaveBeenCalledWith(
      expect.stringMatching(/\.png$/),
      expect.any(Buffer),
      'image/png'
    );
    expect(minio.getFileUrl).toHaveBeenCalledWith(mockUploadedObjectName);

    expect(publishThumbnailJobMock).toHaveBeenCalledWith(
      expect.objectContaining({ mediaId: createdRecord.id, filename: mockUploadedObjectName, userId })
    );
  });
});
