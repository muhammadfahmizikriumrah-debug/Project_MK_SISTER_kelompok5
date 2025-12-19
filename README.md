# taskThink - Platform Portofolio Dosen Terdistribusi

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![Docker](https://img.shields.io/badge/Docker-Compose-blue)
![Microservices](https://img.shields.io/badge/Architecture-Microservices-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 📋 Deskripsi Proyek

taskThink adalah portal portofolio berbasis arsitektur **microservices** yang memungkinkan dosen untuk mengelola profil dan portofolio proyek mereka secara online. Sistem ini dibangun dengan prinsip **sistem terdistribusi** untuk skalabilitas dan ketahanan tinggi, mendemonstrasikan implementasi modern dari pola arsitektur cloud-native.

### 🎯 Tujuan Proyek
- Implementasi arsitektur microservices yang scalable
- Demonstrasi sistem terdistribusi dengan message broker
- Best practices dalam API design dan data management
- High availability dengan fault tolerance
- Performance optimization dengan caching dan async processing

## 🏗️ Arsitektur Sistem

### Microservices:
1. **Auth Service** - Autentikasi & Otorisasi (JWT)
2. **User Service** - Manajemen data user
3. **Profile Service** - Manajemen profil dosen
4. **Portfolio Service** - CRUD proyek portofolio
5. **Media Service** - Upload & manajemen media
6. **Search Service** - Pencarian proyek dengan indexing
7. **Worker Service** - Asynchronous thumbnail generation

### Infrastructure:
- **API Gateway** - Nginx reverse proxy
- **Message Broker** - RabbitMQ untuk async processing
- **Database** - PostgreSQL (per service)
- **Object Storage** - MinIO untuk media files
- **Cache** - Redis untuk performa
- **Search Engine** - Meilisearch untuk full-text search

## 🚀 Teknologi Stack

### Backend:
- Node.js + Express.js
- PostgreSQL
- JWT Authentication
- RabbitMQ
- MinIO

### Frontend:
- React + Vite
- TailwindCSS
- Axios
- React Router

### DevOps:
- Docker & Docker Compose
- Nginx

## 📦 Fitur Utama

### Fitur Minimal:
- ✅ Registrasi & Login dengan JWT
- ✅ Manajemen Profil (nama, bio, kontak, social links)
- ✅ CRUD Proyek Portofolio (judul, deskripsi, tag, link)
- ✅ Upload Gambar dengan auto thumbnail generation
- ✅ Halaman Profil Publik: `/u/{username}`
- ✅ Pencarian Proyek (nama/tag)

### Fitur Bonus:
- ✅ Mode publik/privat proyek
- ✅ Dashboard analytics
- ✅ Caching untuk performa

## 🛠️ Instalasi & Menjalankan

### Prerequisites:
- Docker & Docker Compose
- Node.js 18+ (untuk development)
- Git

### Quick Start:

```bash
# Clone repository
git clone <repository-url>
cd thaskThink_Dosen

# Jalankan semua services dengan Docker Compose
docker-compose up -d

# Tunggu hingga semua services ready (~30 detik)

# Akses aplikasi
Frontend: http://localhost:3000
API Gateway: http://localhost:8080
MinIO Console: http://localhost:9001
RabbitMQ Management: http://localhost:15672
```

### Development Mode:

```bash
# Install dependencies untuk semua services
npm run install-all

# Jalankan infrastructure (DB, RabbitMQ, MinIO, Redis)
docker-compose up -d postgres rabbitmq minio redis meilisearch

# Jalankan services secara individual
cd services/auth-service && npm run dev
cd services/user-service && npm run dev
cd services/profile-service && npm run dev
cd services/portfolio-service && npm run dev
cd services/media-service && npm run dev
cd services/search-service && npm run dev
cd services/worker-service && npm run dev

# Jalankan frontend
cd frontend && npm run dev
```

## 📁 Struktur Proyek

```
.
├── services/
│   ├── auth-service/          # JWT Authentication
│   ├── user-service/          # User management
│   ├── profile-service/       # Profile management
│   ├── portfolio-service/     # Portfolio CRUD
│   ├── media-service/         # Media upload & storage
│   ├── search-service/        # Search & indexing
│   └── worker-service/        # Async thumbnail worker
├── frontend/                  # React frontend
├── api-gateway/              # Nginx configuration
├── docker-compose.yml        # Docker orchestration
├── docs/                     # Dokumentasi & laporan
└── README.md
```

## 🔌 API Endpoints

### Auth Service (Port 3001)
- `POST /api/auth/register` - Register user baru
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/verify` - Verify token

### User Service (Port 3002)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `GET /api/users/username/:username` - Get by username

### Profile Service (Port 3003)
- `GET /api/profiles/:userId` - Get profile
- `PUT /api/profiles/:userId` - Update profile
- `GET /api/profiles/public/:username` - Public profile

### Portfolio Service (Port 3004)
- `GET /api/portfolios` - List portfolios
- `POST /api/portfolios` - Create portfolio
- `GET /api/portfolios/:id` - Get portfolio
- `PUT /api/portfolios/:id` - Update portfolio
- `DELETE /api/portfolios/:id` - Delete portfolio
- `GET /api/portfolios/user/:userId` - Get by user

### Media Service (Port 3005)
- `POST /api/media/upload` - Upload file
- `GET /api/media/:id` - Get media info
- `DELETE /api/media/:id` - Delete media

### Search Service (Port 3006)
- `GET /api/search/portfolios` - Search portfolios
- `POST /api/search/index` - Index portfolio

## 🧪 Testing & Quality Assurance

### Test Coverage:
```bash
# Unit tests untuk semua services
npm run test

# Integration tests antar services
npm run test:integration

# Load testing dengan k6
node tests/load/load_test.js  # 50 concurrent users
node tests/load/load_test_high.js  # 200 concurrent users
```

### Test Results Summary:
- ✅ **Unit Tests**: Auth Controller validation & JWT flow
- ✅ **Integration Tests**: Auth ↔ User service communication
- ✅ **Async Processing**: Media upload & thumbnail generation
- ✅ **Search Indexing**: Portfolio indexing & caching consistency
- ✅ **Load Testing**: 100% success rate up to 200 concurrent users
- ✅ **Performance**: Sub-20ms latency at p99 percentile

## 📈 Performance Metrics

### Load Testing Results:
| Metric | 50 Users | 200 Users |
|--------|----------|-----------|
| Total Requests | 1,215 | 4,866 |
| Success Rate | 100% | 100% |
| Average Latency | 5.04ms | 6.61ms |
| p95 Latency | 8.51ms | 13.76ms |
| p99 Latency | 12.93ms | 19.50ms |

### System Capabilities:
- **Horizontal Scaling**: Auto-recovery & load balancing
- **Async Processing**: Non-blocking media operations
- **Caching Layer**: Redis untuk frequently accessed data
- **Search Performance**: Meilisearch dengan typo tolerance
- **Storage Efficiency**: MinIO dengan automatic thumbnail generation

## 📊 Monitoring & Logging

- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)
- **Logs**: `docker-compose logs -f [service-name]`

## 🔒 Security

- JWT token dengan expiry
- Password hashing dengan bcrypt
- CORS configuration
- Rate limiting pada API Gateway
- Input validation & sanitization

## 📈 Scalability

- Horizontal scaling untuk semua services
- Load balancing via Nginx
- Asynchronous processing dengan RabbitMQ
- Caching dengan Redis
- Database connection pooling

## 👥 Tim Pengembang

**Final Project Team - SISTER Semester 5**

- Fahmi Ahmad Nurhidayat - Lead Developer & Architecture
- [Anggota 2] - Backend Developer
- [Anggota 3] - Frontend Developer  
- [Anggota 4] - DevOps & Testing

## 📄 Lisensi

MIT License - feel free to use this project for learning and development purposes.

## 📞 Kontak & Kontribusi

### 🚀 How to Contribute:
1. Fork repository ini
2. Buat feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buka Pull Request

### 📧 Hubungi Kami:
- **Project Repository**: [GitHub URL]
- **Issues & Bug Reports**: [GitHub Issues URL]
- **Documentation**: Lihat folder `/docs`

---

## 🌟 Special Thanks

Terima kasih kepada:
- Tim pengajar SISTER untuk bimbingan dan support
- Open source community untuk libraries yang digunakan
- Docker team untuk containerization platform

---

**⭐ Jika proyek ini bermanfaat, jangan lupa berikan bintang!**
