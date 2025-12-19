const sharp = require('sharp');
const Minio = require('minio');
const { Media } = require('../models');

// Konfigurasi koneksi MinIO Object Storage
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT) || 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123'
});

// Konstanta untuk processing thumbnail
const BUCKET_NAME = process.env.MINIO_BUCKET || 'portfolio-media';
const THUMBNAIL_WIDTH = 400;  // Lebar thumbnail 400px
const THUMBNAIL_HEIGHT = 300; // Tinggi thumbnail 300px

/**
 * Fungsi utama untuk memproses media dan generate thumbnail
 * @param {Object} job - Object berisi metadata media
 * @param {string} job.mediaId - ID media di database
 * @param {string} job.filename - Nama file di MinIO
 * @param {string} job.userId - ID user pemilik media
 */
async function processMedia(job) {
  const { mediaId, filename, userId } = job;

  try {
    console.log(`🔄 Processing thumbnail for: ${filename}`);

    // Step 1: Update status database menjadi 'processing'
    // Memberi tahu user bahwa thumbnail sedang dibuat
    await Media.update(
      { status: 'processing' },
      { where: { id: mediaId } }
    );

    // Step 2: Download original image dari MinIO storage
    // Mengambil file gambar asli untuk diproses
    // MinIO SDK menggunakan callback; wrap ke Promise agar bisa await
    const dataStream = await new Promise((resolve, reject) => {
      minioClient.getObject(BUCKET_NAME, filename, (err, stream) => {
        if (err) return reject(new Error(`MinIO getObject error: ${err.message || err}`));
        resolve(stream);
      });
    });

    const chunks = [];
    await new Promise((resolve, reject) => {
      dataStream.on('data', (chunk) => chunks.push(chunk));
      dataStream.on('end', resolve);
      dataStream.on('error', (err) => reject(new Error(`Stream read error: ${err.message || err}`)));
    });

    // Step 3: Convert stream menjadi buffer
    // Menggabungkan chunks menjadi satu buffer utuh
    const imageBuffer = Buffer.concat(chunks);

    // Step 4: Get metadata image asli
    // Mendapatkan informasi dimensi dan format gambar
    const metadata = await sharp(imageBuffer).metadata();

    // Step 5: Generate thumbnail dengan Sharp library
    // - Resize ke 400x300px dengan fit 'cover' (memotong agar proporsional)
    // - Konversi ke JPEG dengan quality 80% (ukuran lebih kecil)
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
        fit: 'cover',      // Memotong gambar agar pas tanpa distorsi
        position: 'center'  // Posisi crop di tengah
      })
      .jpeg({ quality: 80 }) // Kompresi ke 80% quality
      .toBuffer();

    // Step 6: Generate nama file thumbnail
    // Menambahkan suffix '_thumb' sebelum ekstensi
    // Contoh: image.jpg → image_thumb.jpg
    // jika tidak ada ekstensi, pakai fallback .jpg
    const thumbnailFilename = filename.includes('.')
      ? filename.replace(/(\.[^.]+)$/, '_thumb$1')
      : `${filename}_thumb.jpg`;

    // Step 7: Upload thumbnail ke MinIO storage
    // Menyimpan file thumbnail yang sudah diproses
    await new Promise((resolve, reject) => {
      minioClient.putObject(
        BUCKET_NAME,
        thumbnailFilename,
        thumbnailBuffer,
        thumbnailBuffer.length,
        { 'Content-Type': 'image/jpeg' },
        (err /*, etag */) => {
          if (err) return reject(new Error(`MinIO putObject error: ${err.message || err}`));
          resolve();
        }
      );
    });

    // Step 8: Generate URL untuk akses thumbnail
    // Membuat URL public untuk mengakses file thumbnail
    const protocol = process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http';
    const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
    const port = process.env.MINIO_PORT || '9000';
    // encode nama file agar karakter khusus tidak merusak URL
    const thumbnailUrl = `${protocol}://${endpoint}:${port}/${BUCKET_NAME}/${encodeURIComponent(thumbnailFilename)}`;

    // Step 9: Update database dengan hasil thumbnail
    // - Simpan URL thumbnail
    // - Update status menjadi 'ready' 
    // - Simpan metadata gambar asli dan thumbnail
    await Media.update(
      {
        thumbnailUrl,  // URL thumbnail yang bisa diakses user
        status: 'ready', // Memberi tahu user thumbnail siap
        metadata: {
          width: metadata.width,    // Lebar gambar asli
          height: metadata.height,  // Tinggi gambar asli
          format: metadata.format,  // Format gambar (jpg, png, dll)
          thumbnailGenerated: true  // Flag bahwa thumbnail sudah dibuat
        }
      },
      { where: { id: mediaId } }
    );

    // Step 10: Log success
    console.log(`✅ Thumbnail generated successfully for: ${filename}`);
  } catch (error) {
    // Error Handling: Jika terjadi error selama processing
    console.error(`❌ Error processing thumbnail for ${filename}:`, error);

    // Step 11: Update status database menjadi 'failed'
    // Memberi tahu user bahwa thumbnail gagal dibuat
    await Media.update(
      { status: 'failed' },
      { where: { id: mediaId } }
    );

    // Step 12: Tandai error sebagai permanent error
    // Agar RabbitMQ tidak mencoba ulang (retry) untuk error yang permanent
    error.permanent = true;
    throw error; // Lempar error ke atas untuk logging
  }
}

// Export function untuk digunakan di worker service
module.exports = {
  processMedia  // Function utama yang dipanggil oleh consumer RabbitMQ
};
