const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123'
});

const BUCKET_NAME = process.env.MINIO_BUCKET || 'portfolio-media';

async function initMinIO() {
  try {
    // Check if bucket exists
    const exists = await minioClient.bucketExists(BUCKET_NAME);

    if (!exists) {
      // Create bucket
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`✅ Bucket '${BUCKET_NAME}' created successfully.`);

      // Set bucket policy to public read
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`]
          }
        ]
      };

      await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
      console.log(`✅ Bucket policy set to public read.`);
    } else {
      console.log(`✅ Bucket '${BUCKET_NAME}' already exists.`);
    }
  } catch (error) {
    console.error('❌ MinIO initialization error:', error);
    throw error;
  }
}

async function uploadToMinIO(filename, buffer, contentType) {
  try {
    await minioClient.putObject(
      BUCKET_NAME,
      filename,
      buffer,
      buffer.length,
      {
        'Content-Type': contentType
      }
    );

    return filename;
  } catch (error) {
    console.error('❌ MinIO upload error:', error);
    throw new Error('Failed to upload file to storage');
  }
}

async function deleteFromMinIO(filename) {
  try {
    await minioClient.removeObject(BUCKET_NAME, filename);
  } catch (error) {
    console.error('❌ MinIO delete error:', error);
    throw new Error('Failed to delete file from storage');
  }
}

async function getFileUrl(filename) {
  try {
    // Use localhost:9000 for browser access (external URL)
    // Internal Docker services use minio:9000
    return `http://localhost:9000/${BUCKET_NAME}/${filename}`;
  } catch (error) {
    console.error('❌ Error generating file URL:', error);
    throw error;
  }
}

async function getObject(filename) {
  try {
    const dataStream = await minioClient.getObject(BUCKET_NAME, filename);
    const chunks = [];

    return new Promise((resolve, reject) => {
      dataStream.on('data', (chunk) => chunks.push(chunk));
      dataStream.on('end', () => resolve(Buffer.concat(chunks)));
      dataStream.on('error', reject);
    });
  } catch (error) {
    console.error('❌ MinIO get object error:', error);
    throw error;
  }
}

module.exports = {
  minioClient,
  initMinIO,
  uploadToMinIO,
  deleteFromMinIO,
  getFileUrl,
  getObject,
  BUCKET_NAME
};
