# Deployment Guide - taskThink

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for development)
- Git

## Quick Start (Production)

1. **Clone Repository**
```bash
git clone <repository-url>
cd thaskThink_Dosen
```

2. **Environment Setup**
```bash
cp .env.example .env
# Edit .env file with your configuration
```

3. **Start All Services**
```bash
docker-compose up -d
```

4. **Verify Services**
```bash
# Check all services are running
docker-compose ps

# Check logs
docker-compose logs -f
```

5. **Access Application**
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8080
- MinIO Console: http://localhost:9001 (minioadmin/minioadmin123)
- RabbitMQ Management: http://localhost:15672 (admin/admin123)

## Development Setup

1. **Start Infrastructure Services**
```bash
docker-compose up -d postgres rabbitmq minio redis meilisearch
```

2. **Install Dependencies**
```bash
npm run install-all
```

3. **Start Services Individually**
```bash
# Terminal 1 - Auth Service
cd services/auth-service
npm run dev

# Terminal 2 - User Service  
cd services/user-service
npm run dev

# Terminal 3 - Profile Service
cd services/profile-service
npm run dev

# Terminal 4 - Portfolio Service
cd services/portfolio-service
npm run dev

# Terminal 5 - Media Service
cd services/media-service
npm run dev

# Terminal 6 - Search Service
cd services/search-service
npm run dev

# Terminal 7 - Worker Service
cd services/worker-service
npm run dev

# Terminal 8 - Frontend
cd frontend
npm run dev
```

## Environment Variables

### Required Variables
```bash
# Database
DATABASE_URL=postgresql://postgres:postgres123@localhost:5432/portfolio_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672

# MinIO
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET=portfolio-media

# Meilisearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_KEY=masterKey123456
```

## Service Ports

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React application |
| Auth Service | 3001 | Authentication & JWT |
| User Service | 3002 | User management |
| Profile Service | 3003 | Profile management |
| Portfolio Service | 3004 | Portfolio CRUD |
| Media Service | 3005 | File upload & storage |
| Search Service | 3006 | Search & indexing |
| API Gateway | 8080 | Nginx reverse proxy |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |
| RabbitMQ | 5672, 15672 | Message broker |
| MinIO | 9000, 9001 | Object storage |
| Meilisearch | 7700 | Search engine |

## Health Checks

Each service provides a health check endpoint:
```bash
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # User Service
curl http://localhost:3003/health  # Profile Service
curl http://localhost:3004/health  # Portfolio Service
curl http://localhost:3005/health  # Media Service
curl http://localhost:3006/health  # Search Service
curl http://localhost:8080/health  # API Gateway
```

## Monitoring & Logs

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f auth-service
docker-compose logs -f portfolio-service
```

### Monitor Resources
```bash
# Container stats
docker stats

# Service status
docker-compose ps
```

## Scaling Services

### Horizontal Scaling
```bash
# Scale portfolio service to 3 instances
docker-compose up -d --scale portfolio-service=3

# Scale multiple services
docker-compose up -d --scale portfolio-service=2 --scale search-service=2
```

### Load Testing
```bash
# Install Apache Benchmark
apt-get install apache2-utils

# Test API endpoints
ab -n 1000 -c 10 http://localhost:8080/api/portfolios
ab -n 500 -c 5 http://localhost:8080/api/search/portfolios?q=test
```

## Backup & Recovery

### Database Backup
```bash
# Backup PostgreSQL
docker exec portfolio-postgres pg_dump -U postgres portfolio_db > backup.sql

# Restore PostgreSQL
docker exec -i portfolio-postgres psql -U postgres portfolio_db < backup.sql
```

### MinIO Backup
```bash
# Backup MinIO data
docker cp portfolio-minio:/data ./minio-backup

# Restore MinIO data
docker cp ./minio-backup portfolio-minio:/data
```

## Troubleshooting

### Common Issues

1. **Services not starting**
```bash
# Check Docker resources
docker system df
docker system prune -f

# Restart services
docker-compose restart
```

2. **Database connection issues**
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Reset database
docker-compose down -v
docker-compose up -d postgres
```

3. **RabbitMQ connection issues**
```bash
# Check RabbitMQ status
docker-compose logs rabbitmq

# Access management UI
# http://localhost:15672 (admin/admin123)
```

4. **MinIO access issues**
```bash
# Check MinIO logs
docker-compose logs minio

# Access MinIO console
# http://localhost:9001 (minioadmin/minioadmin123)
```

### Performance Optimization

1. **Enable Redis caching**
2. **Configure database connection pooling**
3. **Use CDN for static assets**
4. **Enable Nginx gzip compression**
5. **Implement rate limiting**

## Security Considerations

1. **Change default passwords**
2. **Use strong JWT secrets**
3. **Enable HTTPS in production**
4. **Configure firewall rules**
5. **Regular security updates**
6. **Monitor access logs**
