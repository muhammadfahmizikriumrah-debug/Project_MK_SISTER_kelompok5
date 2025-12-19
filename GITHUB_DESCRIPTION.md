# taskThink - Platform Portofolio Dosen Terdistribusi

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![Docker](https://img.shields.io/badge/Docker-Compose-blue)
![Microservices](https://img.shields.io/badge/Architecture-Microservices-orange)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Overview

taskThink adalah **portal portofolio dosen** berbasis arsitektur **microservices** yang modern dan scalable. Dibangun dengan teknologi terkini untuk mendemonstrasikan implementasi sistem terdistribusi yang robust dan performant.

### ✨ Key Features
- 🔐 **JWT Authentication** - Secure login & session management
- 👤 **Profile Management** - Complete lecturer profile system
- 📁 **Portfolio CRUD** - Create, read, update, delete projects
- 📸 **Media Upload** - Image upload with auto thumbnail generation
- 🔍 **Full-text Search** - Fast search with Meilisearch
- 📊 **Public Profiles** - Shareable portfolio pages
- 🎯 **Analytics Dashboard** - Portfolio insights & metrics

## 🏗️ Architecture Highlights

### Microservices Design
```
┌─────────────────┐    ┌─────────────────┐
│   Auth Service  │    │   User Service  │
│   (JWT Auth)    │    │  (User Data)    │
└─────────────────┘    └─────────────────┘
         │                       │
┌─────────────────┐    ┌─────────────────┐
│ Profile Service │    │Portfolio Service│
│  (Profile Mgmt) │    │ (Project CRUD)  │
└─────────────────┘    └─────────────────┘
         │                       │
┌─────────────────┐    ┌─────────────────┐
│  Media Service  │    │ Search Service  │
│  (File Upload)  │    │ (Full-text)     │
└─────────────────┘    └─────────────────┘
```

### Technology Stack
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (per service)
- **Cache**: Redis
- **Message Broker**: RabbitMQ
- **Object Storage**: MinIO (S3-compatible)
- **Search Engine**: Meilisearch
- **Frontend**: React + Vite + TailwindCSS
- **API Gateway**: Nginx
- **Containerization**: Docker & Docker Compose

## 🎯 Performance Metrics

| Load Level | Requests | Success Rate | Avg Latency | p95 Latency |
|------------|----------|--------------|-------------|-------------|
| 50 Users   | 1,215    | 100%         | 5.04ms      | 8.51ms      |
| 200 Users  | 4,866    | 100%         | 6.61ms      | 13.76ms     |

## 🛠️ Quick Start

```bash
# Clone & Run
git clone <repository-url>
cd thaskThink_Dosen
docker-compose up -d

# Access the app
Frontend: http://localhost:3000
API Gateway: http://localhost:8080
```

## 🧪 Testing Coverage

- ✅ **Unit Tests** - Component isolation testing
- ✅ **Integration Tests** - Service communication validation
- ✅ **Load Tests** - Performance under concurrent load
- ✅ **Async Processing** - Background job verification
- ✅ **Search Indexing** - Data consistency checks

## 📁 Project Structure

```
services/
├── auth-service/          # JWT Authentication
├── user-service/          # User management
├── profile-service/       # Profile management
├── portfolio-service/     # Portfolio CRUD
├── media-service/         # Media upload & storage
├── search-service/        # Search & indexing
└── worker-service/        # Async thumbnail worker
frontend/                  # React frontend
api-gateway/              # Nginx configuration
tests/                    # Test suites
```

## 🔧 Development

```bash
# Install dependencies
npm run install-all

# Development mode
npm run dev

# Run tests
npm run test

# Load testing
node tests/load/load_test.js
```

## 📊 Monitoring

- **RabbitMQ Management**: http://localhost:15672
- **MinIO Console**: http://localhost:9001
- **Service Logs**: `docker-compose logs -f [service]`

## 🌟 What Makes This Special?

- **Cloud-Native Architecture**: Designed for scalability
- **Event-Driven Communication**: Async processing with RabbitMQ
- **High Performance**: Sub-20ms latency at scale
- **Production Ready**: Health checks, monitoring, fault tolerance
- **Modern Tech Stack**: Latest Node.js, Docker, and cloud services

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**⭐ Star this repo if it helps you learn microservices!**

Built with ❤️ for educational purposes and modern software engineering practices.
