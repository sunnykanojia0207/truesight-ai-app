# TrueSight AI - Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- At least 8GB RAM
- 20GB free disk space
- Domain name (for production)
- SSL certificates (for HTTPS)

## Environment Configuration

### Required Environment Variables

All services require specific environment variables to function correctly. Copy the example file and configure:

```bash
cp .env.production.example .env
```

#### MongoDB Variables
- `MONGO_ROOT_USERNAME`: MongoDB root username (default: admin)
- `MONGO_ROOT_PASSWORD`: **REQUIRED** - Strong password for MongoDB
- `MONGO_DATABASE`: Database name (default: truesight)

#### Redis Variables
- `REDIS_PASSWORD`: **REQUIRED** - Strong password for Redis cache

#### AI Engine Variables
- `AI_ENGINE_API_KEY`: **REQUIRED** - Secure random key for API authentication
- `AI_ENGINE_PORT`: Port for AI engine (default: 8000)

#### Backend Gateway Variables
- `NODE_ENV`: Environment (production/development)
- `PORT`: Backend port (default: 3000)
- `CORS_ORIGIN`: Frontend URL for CORS
- `RATE_LIMIT_WINDOW_MS`: Rate limit window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS`: Max requests per window

#### Frontend Variables
- `VITE_API_URL`: Backend API URL
- `FRONTEND_URL`: Public frontend URL
- `FRONTEND_PORT`: Frontend port (default: 80)

### Generating Secure Keys

Use these commands to generate secure random keys:

```bash
# For API keys and secrets
openssl rand -hex 32

# For passwords
openssl rand -base64 24
```

## Development Deployment

### Start all services:

```bash
docker-compose up -d
```

### View logs:

```bash
docker-compose logs -f
```

### Stop services:

```bash
docker-compose down
```

## Production Deployment

### 1. Configure Environment

Edit `.env` file with production values:
- Use strong passwords
- Set correct domain names
- Configure SSL certificates

### 2. Build and Start Services

```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### 3. Verify Health

Check all services are healthy:

```bash
docker-compose -f docker-compose.prod.yml ps
```

### 4. View Logs

```bash
docker-compose -f docker-compose.prod.yml logs -f
```

## SSL/TLS Configuration

### Using Let's Encrypt

1. Install certbot:
```bash
sudo apt-get install certbot
```

2. Generate certificates:
```bash
sudo certbot certonly --standalone -d yourdomain.com
```

3. Copy certificates to nginx/ssl directory:
```bash
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./nginx/ssl/
```

4. Update nginx configuration to use SSL

## Backup and Restore

### Backup MongoDB

```bash
docker exec truesight-mongodb-prod mongodump --out /backup
docker cp truesight-mongodb-prod:/backup ./mongodb-backup
```

### Restore MongoDB

```bash
docker cp ./mongodb-backup truesight-mongodb-prod:/backup
docker exec truesight-mongodb-prod mongorestore /backup
```

### Backup Redis

```bash
docker exec truesight-redis-prod redis-cli --rdb /data/dump.rdb save
docker cp truesight-redis-prod:/data/dump.rdb ./redis-backup.rdb
```

## Monitoring

### Health Checks

All services include health checks. View status:

```bash
docker-compose -f docker-compose.prod.yml ps
```

### Resource Usage

```bash
docker stats
```

### Application Logs

```bash
# Backend logs
docker logs -f truesight-backend-prod

# AI Engine logs
docker logs -f truesight-ai-engine-prod

# Frontend logs
docker logs -f truesight-frontend-prod
```

## Scaling

### Scale Backend Instances

```bash
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Scale AI Engine Instances

```bash
docker-compose -f docker-compose.prod.yml up -d --scale ai-engine=2
```

## Troubleshooting

### Service Won't Start

1. Check logs:
```bash
docker-compose logs [service-name]
```

2. Verify environment variables:
```bash
docker-compose config
```

3. Check disk space:
```bash
df -h
```

### Database Connection Issues

1. Verify MongoDB is running:
```bash
docker exec truesight-mongodb-prod mongosh --eval "db.adminCommand('ping')"
```

2. Check connection string in backend logs

### AI Engine Timeout

1. Increase timeout in backend environment:
```
ANALYSIS_TIMEOUT_MS=180000
```

2. Check AI engine resources:
```bash
docker stats truesight-ai-engine-prod
```

## Security Best Practices

1. **Never commit .env files** - Add to .gitignore
2. **Use strong passwords** - Minimum 24 characters
3. **Rotate API keys regularly** - Every 90 days
4. **Enable firewall** - Only expose necessary ports
5. **Use HTTPS only** - Redirect HTTP to HTTPS
6. **Regular updates** - Keep Docker images updated
7. **Monitor logs** - Set up log aggregation
8. **Backup regularly** - Automated daily backups

## Performance Optimization

### MongoDB Indexes

Connect to MongoDB and create indexes:

```bash
docker exec -it truesight-mongodb-prod mongosh -u admin -p password
```

```javascript
use truesight
db.analyses.createIndex({ createdAt: -1 })
db.analyses.createIndex({ status: 1 })
db.analyses.createIndex({ userId: 1, createdAt: -1 })
```

### Redis Memory Optimization

Set max memory policy:

```bash
docker exec truesight-redis-prod redis-cli CONFIG SET maxmemory-policy allkeys-lru
docker exec truesight-redis-prod redis-cli CONFIG SET maxmemory 256mb
```

## Maintenance

### Update Services

```bash
# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Restart with new images
docker-compose -f docker-compose.prod.yml up -d
```

### Clean Up

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune
```

## Support

For issues and questions:
- Check logs first
- Review environment configuration
- Verify all services are healthy
- Check resource availability (CPU, RAM, Disk)
