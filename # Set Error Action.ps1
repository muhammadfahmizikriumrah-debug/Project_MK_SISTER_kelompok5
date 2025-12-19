# Set Error Action
$ErrorActionPreference = "Stop"

# Get current directory
$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
cd $projectRoot

Write-Host "Creating taskThink Project Structure..." -ForegroundColor Cyan
Write-Host ""

# Create main directories
$folders = @(
    "services\auth-service",
    "services\profile-service",
    "services\portfolio-service",
    "services\media-service",
    "services\search-service",
    "services\worker",
    "frontend\src\components",
    "frontend\src\pages",
    "frontend\src\services",
    "frontend\src\styles",
    "frontend\public",
    "docs\architecture",
    "docs\api-spec",
    "docs\database",
    "nginx",
    "scripts"
)

Write-Host "📁 Creating directories..." -ForegroundColor Yellow
foreach ($folder in $folders) {
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder -Force | Out-Null
        Write-Host "  ✓ Created: $folder" -ForegroundColor Green
    } else {
        Write-Host "  ✓ Exists: $folder" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "📄 Creating configuration files..." -ForegroundColor Yellow

# Create .gitignore
$gitignore = @"
node_modules/
package-lock.json
yarn.lock
.env
.env.local
.vscode/
.idea/
*.log
.DS_Store
postgres_data/
minio_data/
rabbitmq_data/
dist/
build/
"@
$gitignore | Out-File -FilePath ".\.gitignore" -Encoding UTF8 -Force
Write-Host "  ✓ Created: .gitignore" -ForegroundColor Green

# Create .env
$env_content = @"
DB_USER=portal_user
DB_PASSWORD=portal_secure_pass123
DB_NAME=portal_db
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
RABBITMQ_USER=guest
RABBITMQ_PASSWORD=guest
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin_password123
NODE_ENV=development
"@
$env_content | Out-File -FilePath ".\.env" -Encoding UTF8 -Force
Write-Host "  ✓ Created: .env" -ForegroundColor Green

# Create init-db.sql
$init_db = @"
CREATE SCHEMA IF NOT EXISTS portal;

CREATE TABLE portal.users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE portal.profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE,
  bio TEXT,
  phone VARCHAR(20),
  location VARCHAR(100),
  website VARCHAR(255),
  social_links JSONB DEFAULT '{}',
  avatar_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES portal.users(id) ON DELETE CASCADE
);

CREATE TABLE portal.projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  tags VARCHAR(50)[] DEFAULT '{}',
  project_link VARCHAR(255),
  github_link VARCHAR(255),
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES portal.users(id) ON DELETE CASCADE
);

CREATE TABLE portal.project_images (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  thumbnail_url VARCHAR(255),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES portal.projects(id) ON DELETE CASCADE
);

CREATE TABLE portal.comments (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  user_id INTEGER,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES portal.projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES portal.users(id) ON DELETE SET NULL
);

CREATE TABLE portal.likes (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  user_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(project_id, user_id),
  FOREIGN KEY (project_id) REFERENCES portal.projects(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES portal.users(id) ON DELETE SET NULL
);

CREATE TABLE portal.analytics (
  id SERIAL PRIMARY KEY,
  profile_user_id INTEGER NOT NULL,
  project_id INTEGER,
  visitor_count INTEGER DEFAULT 0,
  last_visited TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_user_id) REFERENCES portal.users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES portal.projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_users_username ON portal.users(username);
CREATE INDEX idx_users_email ON portal.users(email);
CREATE INDEX idx_projects_user_id ON portal.projects(user_id);
CREATE INDEX idx_projects_is_public ON portal.projects(is_public);
CREATE INDEX idx_project_images_project_id ON portal.project_images(project_id);
"@
$init_db | Out-File -FilePath ".\init-db.sql" -Encoding UTF8 -Force
Write-Host "  ✓ Created: init-db.sql" -ForegroundColor Green

Write-Host ""
Write-Host "🐳 Creating Docker and service files..." -ForegroundColor Yellow

# Create docker-compose.yml
$docker_compose = Get-Content -Path ".\docker-compose.yml" -ErrorAction SilentlyContinue
if (-not $docker_compose) {
    $docker_compose_content = @"
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: portal_postgres
    environment:
      POSTGRES_USER: `${DB_USER:-portal_user}
      POSTGRES_PASSWORD: `${DB_PASSWORD:-portal_secure_pass123}
      POSTGRES_DB: portal_db
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init-db.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - portal_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U portal_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  rabbitmq:
    image: rabbitmq:3.12-management-alpine
    container_name: portal_rabbitmq
    environment:
      RABBITMQ_DEFAULT_USER: `${RABBITMQ_USER:-guest}
      RABBITMQ_DEFAULT_PASS: `${RABBITMQ_PASSWORD:-guest}
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
    ports:
      - "5672:5672"
      - "15672:15672"
    networks:
      - portal_network
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "-q", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5

  minio:
    image: minio/minio:latest
    container_name: portal_minio
    environment:
      MINIO_ROOT_USER: `${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: `${MINIO_ROOT_PASSWORD:-minioadmin_password123}
    volumes:
      - minio_data:/minio_data
    ports:
      - "9000:9000"
      - "9001:9001"
    command: minio server /minio_data --console-address ":9001"
    networks:
      - portal_network

  auth-service:
    build:
      context: ./services/auth-service
      dockerfile: Dockerfile
    container_name: portal_auth
    environment:
      NODE_ENV: `${NODE_ENV:-development}
      DB_HOST: postgres
      DB_USER: `${DB_USER:-portal_user}
      DB_PASSWORD: `${DB_PASSWORD:-portal_secure_pass123}
      DB_NAME: portal_db
      JWT_SECRET: `${JWT_SECRET:-your_super_secret_jwt_key_change_this_in_production}
      RABBITMQ_URL: amqp://`${RABBITMQ_USER:-guest}:`${RABBITMQ_PASSWORD:-guest}@rabbitmq:5672
    depends_on:
      postgres:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    ports:
      - "3001:3001"
    networks:
      - portal_network

  profile-service:
    build:
      context: ./services/profile-service
      dockerfile: Dockerfile
    container_name: portal_profile
    environment:
      NODE_ENV: `${NODE_ENV:-development}
      DB_HOST: postgres
      DB_USER: `${DB_USER:-portal_user}
      DB_PASSWORD: `${DB_PASSWORD:-portal_secure_pass123}
      DB_NAME: portal_db
      JWT_SECRET: `${JWT_SECRET:-your_super_secret_jwt_key_change_this_in_production}
      RABBITMQ_URL: amqp://`${RABBITMQ_USER:-guest}:`${RABBITMQ_PASSWORD:-guest}@rabbitmq:5672
    depends_on:
      - postgres
      - rabbitmq
    ports:
      - "3002:3002"
    networks:
      - portal_network

  portfolio-service:
    build:
      context: ./services/portfolio-service
      dockerfile: Dockerfile
    container_name: portal_portfolio
    environment:
      NODE_ENV: `${NODE_ENV:-development}
      DB_HOST: postgres
      DB_USER: `${DB_USER:-portal_user}
      DB_PASSWORD: `${DB_PASSWORD:-portal_secure_pass123}
      DB_NAME: portal_db
      JWT_SECRET: `${JWT_SECRET:-your_super_secret_jwt_key_change_this_in_production}
      RABBITMQ_URL: amqp://`${RABBITMQ_USER:-guest}:`${RABBITMQ_PASSWORD:-guest}@rabbitmq:5672
    depends_on:
      - postgres
      - rabbitmq
    ports:
      - "3003:3003"
    networks:
      - portal_network

  media-service:
    build:
      context: ./services/media-service
      dockerfile: Dockerfile
    container_name: portal_media
    environment:
      NODE_ENV: `${NODE_ENV:-development}
      DB_HOST: postgres
      DB_USER: `${DB_USER:-portal_user}
      DB_PASSWORD: `${DB_PASSWORD:-portal_secure_pass123}
      DB_NAME: portal_db
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000
      MINIO_ACCESS_KEY: `${MINIO_ROOT_USER:-minioadmin}
      MINIO_SECRET_KEY: `${MINIO_ROOT_PASSWORD:-minioadmin_password123}
      RABBITMQ_URL: amqp://`${RABBITMQ_USER:-guest}:`${RABBITMQ_PASSWORD:-guest}@rabbitmq:5672
      JWT_SECRET: `${JWT_SECRET:-your_super_secret_jwt_key_change_this_in_production}
    depends_on:
      - postgres
      - rabbitmq
      - minio
    ports:
      - "3004:3004"
    networks:
      - portal_network

  search-service:
    build:
      context: ./services/search-service
      dockerfile: Dockerfile
    container_name: portal_search
    environment:
      NODE_ENV: `${NODE_ENV:-development}
      DB_HOST: postgres
      DB_USER: `${DB_USER:-portal_user}
      DB_PASSWORD: `${DB_PASSWORD:-portal_secure_pass123}
      DB_NAME: portal_db
      RABBITMQ_URL: amqp://`${RABBITMQ_USER:-guest}:`${RABBITMQ_PASSWORD:-guest}@rabbitmq:5672
    depends_on:
      - postgres
      - rabbitmq
    ports:
      - "3005:3005"
    networks:
      - portal_network

  worker-service:
    build:
      context: ./services/worker
      dockerfile: Dockerfile
    container_name: portal_worker
    environment:
      NODE_ENV: `${NODE_ENV:-development}
      MINIO_ENDPOINT: minio
      MINIO_PORT: 9000
      MINIO_ACCESS_KEY: `${MINIO_ROOT_USER:-minioadmin}
      MINIO_SECRET_KEY: `${MINIO_ROOT_PASSWORD:-minioadmin_password123}
      RABBITMQ_URL: amqp://`${RABBITMQ_USER:-guest}:`${RABBITMQ_PASSWORD:-guest}@rabbitmq:5672
    depends_on:
      - rabbitmq
      - minio
    networks:
      - portal_network

  nginx:
    image: nginx:alpine
    container_name: portal_nginx
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "80:80"
    depends_on:
      - auth-service
      - profile-service
      - portfolio-service
      - media-service
      - search-service
    networks:
      - portal_network

volumes:
  postgres_data:
  rabbitmq_data:
  minio_data:

networks:
  portal_network:
    driver: bridge
"@
    $docker_compose_content | Out-File -FilePath ".\docker-compose.yml" -Encoding UTF8 -Force
    Write-Host "  ✓ Created: docker-compose.yml" -ForegroundColor Green
}

# Create Auth Service files
Write-Host ""
Write-Host "🔐 Creating Auth Service..." -ForegroundColor Yellow

$auth_dockerfile = @"
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["npm", "start"]
"@
$auth_dockerfile | Out-File -FilePath ".\services\auth-service\Dockerfile" -Encoding UTF8 -Force
Write-Host "  ✓ Created: services\auth-service\Dockerfile" -ForegroundColor Green

$auth_package = @"
{
  "name": "auth-service",
  "version": "1.0.0",
  "description": "Authentication Service for Portal",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.0",
    "jsonwebtoken": "^9.1.0",
    "bcryptjs": "^2.4.3",
    "amqplib": "^0.10.3",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
"@
$auth_package | Out-File -FilePath ".\services\auth-service\package.json" -Encoding UTF8 -Force
Write-Host "  ✓ Created: services\auth-service\package.json" -ForegroundColor Green

$auth_index = @"
const express = require('express');
const pg = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const amqp = require('amqplib');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,
});

let channel;

async function initRabbitMQ() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange('portal_events', 'topic', { durable: true });
    console.log('RabbitMQ connected');
  } catch (error) {
    console.error('RabbitMQ connection failed:', error);
    setTimeout(initRabbitMQ, 5000);
  }
}

initRabbitMQ();

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO portal.users (username, email, password_hash) VALUES (\$1, \$2, \$3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );

    if (channel) {
      await channel.publish(
        'portal_events',
        'user.created',
        Buffer.from(JSON.stringify({ userId: result.rows[0].id, username }))
      );
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Missing email or password' });
    }

    const result = await pool.query(
      'SELECT id, username, email, password_hash FROM portal.users WHERE email = \$1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/api/auth/verify', verifyToken, (req, res) => {
  res.json({ valid: true, user: req.user });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(\`Auth Service running on port \${PORT}\`);
});
"@
$auth_index | Out-File -FilePath ".\services\auth-service\index.js" -Encoding UTF8 -Force
Write-Host "  ✓ Created: services\auth-service\index.js" -ForegroundColor Green

# Create Profile Service files
Write-Host ""
Write-Host "👤 Creating Profile Service..." -ForegroundColor Yellow

$profile_dockerfile = @"
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3002

CMD ["npm", "start"]
"@
$profile_dockerfile | Out-File -FilePath ".\services\profile-service\Dockerfile" -Encoding UTF8 -Force
Write-Host "  ✓ Created: services\profile-service\Dockerfile" -ForegroundColor Green

$profile_package = @"
{
  "name": "profile-service",
  "version": "1.0.0",
  "description": "Profile Service for Portal",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.0",
    "jsonwebtoken": "^9.1.0",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
"@
$profile_package | Out-File -FilePath ".\services\profile-service\package.json" -Encoding UTF8 -Force
Write-Host "  ✓ Created: services\profile-service\package.json" -ForegroundColor Green

$profile_index = @"
const express = require('express');
const pg = require('pg');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,
});

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};

app.get('/api/profile/:username', async (req, res) => {
  try {
    const result = await pool.query(
      \`SELECT u.id, u.username, u.email, p.bio, p.phone, p.location, p.website, p.social_links, p.avatar_url
       FROM portal.users u
       LEFT JOIN portal.profiles p ON u.id = p.user_id
       WHERE u.username = \$1\`,
      [req.params.username]
    );
    res.json(result.rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/profile', verifyToken, async (req, res) => {
  try {
    const { bio, phone, location, website, social_links, avatar_url } = req.body;
    const result = await pool.query(
      \`INSERT INTO portal.profiles (user_id, bio, phone, location, website, social_links, avatar_url)
       VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7) RETURNING *\`,
      [req.user.userId, bio, phone, location, website, social_links || {}, avatar_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/profile', verifyToken, async (req, res) => {
  try {
    const { bio, phone, location, website, social_links, avatar_url } = req.body;
    const result = await pool.query(
      \`UPDATE portal.profiles SET bio=\$1, phone=\$2, location=\$3, website=\$4, social_links=\$5, avatar_url=\$6
       WHERE user_id=\$7 RETURNING *\`,
      [bio, phone, location, website, social_links || {}, avatar_url, req.user.userId]
    );
    res.json(result.rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3002;
app.listen(PORT, () => console.log(\`Profile Service on port \${PORT}\`));
"@
$profile_index | Out-File -FilePath ".\services\profile-service\index.js" -Encoding UTF8 -Force
Write-Host "  ✓ Created: services\profile-service\index.js" -ForegroundColor Green

# Create Portfolio Service files
Write-Host ""
Write-Host "📂 Creating Portfolio Service..." -ForegroundColor Yellow

$portfolio_dockerfile = @"
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3003

CMD ["npm", "start"]
"@
$portfolio_dockerfile | Out-File -FilePath ".\services\portfolio-service\Dockerfile" -Encoding UTF8 -Force
Write-Host "  ✓ Created: services\portfolio-service\Dockerfile" -ForegroundColor Green

$portfolio_package = @"
{
  "name": "portfolio-service",
  "version": "1.0.0",
  "description": "Portfolio Service for Portal",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.0",
    "jsonwebtoken": "^9.1.0",
    "amqplib": "^0.10.3",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
"@
$portfolio_package | Out-File -FilePath ".\services\portfolio-service\package.json" -Encoding UTF8 -Force
Write-Host "  ✓ Created: services\portfolio-service\package.json" -ForegroundColor Green

$portfolio_index = @"
const express = require('express');
const pg = require('pg');
const amqp = require('amqplib');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,
});

let channel;

async function initRabbitMQ() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange('portal_events', 'topic', { durable: true });
  } catch (error) {
    console.error('RabbitMQ connection failed:', error);
    setTimeout(initRabbitMQ, 5000);
  }
}

initRabbitMQ();

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};

app.post('/api/portfolio/projects', verifyToken, async (req, res) => {
  try {
    const { title, description, tags, project_link, github_link, is_public } = req.body;
    const userId = req.user.userId;

    const result = await pool.query(
      \`INSERT INTO portal.projects (user_id, title, description, tags, project_link, github_link, is_public) 
       VALUES (\$1, \$2, \$3, \$4, \$5, \$6, \$7) RETURNING *\`,
      [userId, title, description, tags || [], project_link, github_link, is_public !== false]
    );

    if (channel) {
      await channel.publish(
        'portal_events',
        'project.created',
        Buffer.from(JSON.stringify({ projectId: result.rows[0].id, userId }))
      );
    }

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/portfolio/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT * FROM portal.projects WHERE user_id = \$1 AND is_public = true ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/portfolio/projects/:projectId', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM portal.projects WHERE id = \$1',
      [req.params.projectId]
    );
    res.json(result.rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/portfolio/projects/:projectId', verifyToken, async (req, res) => {
  try {
    const { title, description, tags, project_link, github_link, is_public } = req.body;
    const result = await pool.query(
      \`UPDATE portal.projects SET title=\$1, description=\$2, tags=\$3, project_link=\$4, github_link=\$5, is_public=\$6 
       WHERE id=\$7 AND user_id=\$8 RETURNING *\`,
      [title, description, tags, project_link, github_link, is_public, req.params.projectId, req.user.userId]
    );
    res.json(result.rows[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/portfolio/projects/:projectId', verifyToken, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM portal.projects WHERE id = \$1 AND user_id = \$2',
      [req.params.projectId, req.user.userId]
    );
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3003;
app.listen(PORT, () => console.log(\`Portfolio Service on port \${PORT}\`));
"@
$portfolio_index | Out-File -FilePath ".\services\portfolio-service\index.js" -Encoding UTF8 -Force
Write-Host "  ✓ Created: services\portfolio-service\index.js" -ForegroundColor Green

# Create Media Service files
Write-Host ""
Write-Host "🖼️  Creating Media Service..." -ForegroundColor Yellow

$media_dockerfile = @"
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3004

CMD ["npm", "start"]
"@
$media_dockerfile | Out-File -FilePath ".\services\media-service\Dockerfile" -Encoding UTF8 -Force
Write-Host "  ✓ Created: services\media-service\Dockerfile" -ForegroundColor Green

$media_package = @"
{
  "name": "media-service",
  "version": "1.0.0",
  "description": "Media Service for Portal",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "minio": "^7.1.3",
    "amqplib": "^0.10.3",
    "jsonwebtoken": "^9.1.0",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
"@
$media_package | Out-File -FilePath ".\services\media-service\package.json" -Encoding UTF8 -Force
Write-Host "  ✓ Created: services\media-service\package.json" -ForegroundColor Green

$media_index = @"
const express = require('express');
const multer = require('multer');
const { Client } = require('minio');
const amqp = require('amqplib');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
app.use(cors());

const upload = multer({ storage: multer.memoryStorage() });

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

let channel;

async function initRabbitMQ() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();
    await channel.assertExchange('portal_events', 'topic', { durable: true });
    await channel.assertQueue('thumbnail_queue', { durable: true });
  } catch (error) {
    console.error('RabbitMQ error:', error);
    setTimeout(initRabbitMQ, 5000);
  }
}

initRabbitMQ();

(async () => {
  try {
    const exists = await minioClient.bucketExists('portfolio-images');
    if (!exists) await minioClient.makeBucket('portfolio-images', 'us-east-1');
  } catch (error) {
    console.error('MinIO error:', error);
  }
})();

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};

app.post('/api/media/upload/:projectId', verifyToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const fileName = \`project_\${req.params.projectId}_\${Date.now()}.jpg\`;
    
    await minioClient.putObject(
      'portfolio-images',
      fileName,
      req.file.buffer,
      req.file.size,
      { 'Content-Type': req.file.mimetype }
    );

    const imageUrl = \`http://\${process.env.MINIO_ENDPOINT}:\${process.env.MINIO_PORT}/portfolio-images/\${fileName}\`;

    if (channel) {
      await channel.sendToQueue(
        'thumbnail_queue',
        Buffer.from(JSON.stringify({ fileName, projectId: req.params.projectId }))
      );
    }

    res.json({ imageUrl, fileName });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3004;
app.listen(PORT, () => console.log(\`Media Service on port \${PORT}\`));
"@
$media_index | Out-File -FilePath ".\services\media-service\index.js" -Encoding UTF8 -Force
Write-Host "  ✓ Created: services\media-service\index.js" -ForegroundColor Green

# Create Search Service files
Write-Host ""
Write-Host "🔍 Creating Search Service..." -ForegroundColor Yellow

$search_dockerfile = @"
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3005

CMD ["npm", "start"]
"@
$search_dockerfile | Out-File -FilePath ".\services\search-service\Dockerfile" -Encoding UTF8 -Force
Write-Host "  ✓ Created: services\search-service\Dockerfile" -ForegroundColor Green

$search_package = @"
{
  "name": "search-service",
  "version": "1.0.0",
  "description": "Search Service for Portal",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.0",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
"@
$search_package | Out-File -FilePath ".\services\search-service\package.json" -Encoding UTF8 -Force
Write-Host "  ✓ Created: services\search-service\package.json" -ForegroundColor Green

$search_index = @"
const express = require('express');
const pg = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,
});

app.get('/api/search/projects', async (req, res) => {
  try {
    const { q, tag } = req.query;
    let query = 'SELECT * FROM portal.projects WHERE is_public = true';
    const params = [];

    if (q) {
      query += \` AND (title ILIKE \$\${params.length + 1} OR description ILIKE \$\${params.length + 1})\`;
      params.push(\`%\${q}%\`);
    }

    if (tag) {
      query += \` AND \$\${params.length + 1} = ANY(tags)\`;
      params.push(tag);
    }

    query += ' ORDER BY created_at DESC LIMIT 20';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/search/tags', async (req, res) => {
  try {
    const result = await pool.query(
      \`SELECT UNNEST(tags) as tag, COUNT(*) as count 
       FROM portal.projects WHERE is_public = true 
       GROUP BY tag ORDER BY count DESC LIMIT 20\`
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3005;
app.listen(PORT, () => console.log(\`Search Service on port \${PORT}\`));
"@
$search_index | Out-File -FilePath ".\services\search-service\index.js" -Encoding UTF8 -Force
Write-Host "  ✓ Created: services\search-service\index.js" -ForegroundColor Green

# Create Worker Service files
Write-Host ""
Write-Host "⚙️  Creating Worker Service..." -ForegroundColor Yellow

$worker_dockerfile = @"
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["npm", "start"]
"@
$worker_dockerfile | Out-File -FilePath ".\services\worker\Dockerfile" -Encoding UTF8 -Force
Write-Host "  ✓ Created: services\worker\Dockerfile" -ForegroundColor Green

$worker_package = @"
{
  "name": "worker-service",
  "version": "1.0.0",
  "description": "Worker Service for async tasks",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "amqplib": "^0.10.3",
    "minio": "^7.1.3",
    "sharp": "^0.32.6",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
"@
$worker_package | Out-File -FilePath ".\services\worker\package.json" -Encoding UTF8 -Force
Write-Host "  ✓ Created: services\worker\package.json" -ForegroundColor Green

$worker_index = @"
const amqp = require('amqplib');
const { Client } = require('minio');
const sharp = require('sharp');
require('dotenv').config();

const minioClient = new Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: parseInt(process.env.MINIO_PORT),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY,
  secretKey: process.env.MINIO_SECRET_KEY,
});

async function startWorker() {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);
    const channel = await connection.createChannel();
    const queue = 'thumbnail_queue';

    await channel.assertQueue(queue, { durable: true });
    channel.prefetch(1);

    console.log('Worker started, waiting for jobs...');

    channel.consume(queue, async (msg) => {
      if (msg) {
        try {
          const { fileName, projectId } = JSON.parse(msg.content.toString());
          console.log(\`Processing thumbnail for: \${fileName}\`);

          const dataStream = await minioClient.getObject('portfolio-images', fileName);
          
          const thumbnailBuffer = await sharp(dataStream)
            .resize(300, 300, { fit: 'cover' })
            .toBuffer();

          const thumbName = \`thumb_\${fileName}\`;
          await minioClient.putObject(
            'portfolio-images',
            thumbName,
            thumbnailBuffer,
            thumbnailBuffer.length,
            { 'Content-Type': 'image/jpeg' }
          );

          console.log(\`Thumbnail created: \${thumbName}\`);
          channel.ack(msg);
        } catch (error) {
          console.error('Processing error:', error);
          channel.nack(msg);
        }
      }
    });
  } catch (error) {
    console.error('Worker error:', error);
    setTimeout(startWorker, 5000);
  }
}

startWorker();
"@
$worker_index | Out-File -FilePath ".\services\worker\index.js" -Encoding UTF8 -Force
Write-Host "  ✓ Created: services\worker\index.js" -ForegroundColor Green

# Create Nginx config
Write-Host ""
Write-Host "🔀 Creating Nginx Configuration..." -ForegroundColor Yellow

$nginx_conf = @"
events { worker_connections 1024; }

http {
  upstream auth_service {
    server auth-service:3001;
  }

  upstream profile_service {
    server profile-service:3002;
  }

  upstream portfolio_service {
    server portfolio-service:3003;
  }

  upstream media_service {
    server media-service:3004;
  }

  upstream search_service {
    server search-service:3005;
  }

  server {
    listen 80;
    server_name localhost;
    client_max_body_size 50M;

    location /api/auth/ {
      proxy_pass http://auth_service;
      proxy_set_header Host `$host;
      proxy_set_header X-Real-IP `$remote_addr;
    }

    location /api/profile/ {
      proxy_pass http://profile_service;
      proxy_set_header Host `$host;
      proxy_set_header X-Real-IP `$remote_addr;
    }

    location /api/portfolio/ {
      proxy_pass http://portfolio_service;
      proxy_set_header Host `$host;
      proxy_set_header X-Real-IP `$remote_addr;
    }

    location /api/media/ {
      proxy_pass http://media_service;
      proxy_set_header Host `$host;
      proxy_set_header X-Real-IP `$remote_addr;
    }

    location /api/search/ {
      proxy_pass http://search_service;
      proxy_set_header Host `$host;
      proxy_set_header X-Real-IP `$remote_addr;
    }
  }
}
"@
$nginx_conf | Out-File -FilePath ".\nginx\nginx.conf" -Encoding UTF8 -Force
Write-Host "  ✓ Created: nginx\nginx.conf" -ForegroundColor Green

# Create README
Write-Host ""
Write-Host "📖 Creating README..." -ForegroundColor Yellow

$readme = @"
# taskThink - Sistem Terdistribusi

Aplikasi web taskThink dengan arsitektur microservices terdistribusi.

## 🏗️ Arsitektur

- **Auth Service** (Port 3001): JWT authentication
- **Profile Service** (Port 3002): User profile management
- **Portfolio Service** (Port 3003): Project CRUD
- **Media Service** (Port 3004): Image upload & MinIO
- **Search Service** (Port 3005): Search & filtering
- **Worker Service**: Async thumbnail generation
- **RabbitMQ**: Message broker
- **MinIO**: Object storage
- **PostgreSQL**: Database
- **Nginx**: API Gateway

## 🚀 Quick Start

\`\`\`bash
cd c:\docker\Aplikasi_Web_Portal_Portofolio_Dosen-app
docker-compose up -d
docker-compose ps
\`\`\`

## 📍 Access Points

- **API Gateway**: http://localhost
- **MinIO Console**: http://localhost:9001
- **RabbitMQ Console**: http://localhost:15672
- **PostgreSQL**: localhost:5432

## 🔐 Default Credentials

- **MinIO**: minioadmin / minioadmin_password123
- **RabbitMQ**: guest / guest
- **PostgreSQL**: portal_user / portal_secure_pass123

## 📚 API Endpoints

### Auth
- \`POST /api/auth/register\` - Register user
- \`POST /api/auth/login\` - Login
- \`GET /api/auth/verify\` - Verify token

### Profile
- \`GET /api/profile/:username\` - Get profile
- \`POST /api/profile\` - Create profile
- \`PUT /api/profile\` - Update profile

### Portfolio
- \`POST /api/portfolio/projects\` - Create project
- \`GET /api/portfolio/user/:userId\` - Get user projects
- \`GET /api/portfolio/projects/:projectId\` - Get project
- \`PUT /api/portfolio/projects/:projectId\` - Update project
- \`DELETE /api/portfolio/projects/:projectId\` - Delete project

### Media
- \`POST /api/media/upload/:projectId\` - Upload image

### Search
- \`GET /api/search/projects\` - Search projects
- \`GET /api/search/tags\` - Get trending tags

## 🧪 Testing

\`\`\`bash
# Register
curl -X POST http://localhost/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"john","email":"john@example.com","password":"pass123"}'

# Login
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"pass123"}'

# Create project
curl -X POST http://localhost/api/portfolio/projects \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"My Project","description":"Desc","tags":["node"]}'
\`\`\`

## 🛑 Stop Services

\`\`\`bash
docker-compose down
\`\`\`

## 📝 License

MIT
"@
$readme | Out-File -FilePath ".\README.md" -Encoding UTF8 -Force
Write-Host "  ✓ Created: README.md" -ForegroundColor Green

# Show completion message
Write-Host ""
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ PROJECT STRUCTURE CREATED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Show project tree
Write-Host "📁 Project Structure:" -ForegroundColor Yellow
Write-Host ""
Get-ChildItem -Path "." -Recurse -Directory | ForEach-Object {
    $depth = ($_.FullName.Split('\').Count) - (Split-Path -Parent $projectRoot).Split('\').Count
    $indent = "  " * $depth
    Write-Host "$indent📁 $($_.Name)"
}

Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Cyan
Write-Host "1. cd c:\docker\Aplikasi_Web_Portal_Portofolio_Dosen-app" -ForegroundColor White
Write-Host "2. docker-compose up -d" -ForegroundColor White
Write-Host "3. docker-compose ps" -ForegroundColor White
Write-Host ""

Write-Host "🌐 Access Points:" -ForegroundColor Cyan
Write-Host "- API Gateway: http://localhost" -ForegroundColor White
Write-Host "- MinIO: http://localhost:9001" -ForegroundColor White
Write-Host "- RabbitMQ: http://localhost:15672" -ForegroundColor White
Write-Host "- PostgreSQL: localhost:5432" -ForegroundColor White
Write-Host ""
