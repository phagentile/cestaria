# 🚀 Deployment Guide - Rugby Analytics Ecosystem

## Table of Contents
1. [Local Development](#local-development)
2. [Staging Deployment](#staging-deployment)
3. [Production Deployment](#production-deployment)
4. [Database Management](#database-management)
5. [Monitoring & Logging](#monitoring--logging)
6. [Troubleshooting](#troubleshooting)

---

## Local Development

### Using Docker Compose (Recommended)

```bash
# 1. Clone repository
git clone <repo-url>
cd rugby-analytics

# 2. Create .env file
cp .env.example .env
# Edit .env with local settings

# 3. Start services
docker-compose up -d

# 4. Verify services are running
docker-compose ps

# 5. View logs
docker-compose logs -f app

# 6. Access application
# API: http://localhost:3001
# Database: localhost:3306
```

### Manual Setup

```bash
# 1. Install Node.js 18+
node --version

# 2. Install MySQL 8.0+
mysql --version

# 3. Clone and setup
git clone <repo-url>
cd rugby-analytics
npm install

# 4. Create database
mysql -u root -p < schema.sql

# 5. Configure .env
cp .env.example .env
# Edit with your settings

# 6. Start server
npm run dev

# 7. Access at http://localhost:3001
```

---

## Staging Deployment

### Prerequisites
- VPS or Cloud VM (t3.small on AWS or equivalent)
- Domain name
- Docker & Docker Compose installed
- SSL certificate (Let's Encrypt recommended)

### Setup Steps

```bash
# 1. SSH into server
ssh ubuntu@staging-server-ip

# 2. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 3. Clone repository
git clone <repo-url>
cd rugby-analytics

# 4. Create production .env
cat > .env << EOF
NODE_ENV=staging
DB_HOST=mysql
DB_USER=rugby_user
DB_PASSWORD=$(openssl rand -base64 32)
DB_NAME=rugby_control
PORT=3001
JWT_SECRET=$(openssl rand -base64 256)
GEMINI_API_KEY=your_api_key
CORS_ORIGIN=https://staging.yourdomain.com
LOG_LEVEL=info
EOF

# 5. Create logs directory
mkdir -p logs uploads

# 6. Pull latest code
git pull origin main

# 7. Build and deploy
docker-compose build
docker-compose up -d

# 8. Verify services
docker-compose ps
curl http://localhost:3001/api/health

# 9. Test API
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"referee@club.com","password":"password123"}'
```

### Health Check

```bash
# Monitor application health
watch -n 5 docker-compose ps

# View real-time logs
docker-compose logs -f --tail=50 app

# Check database connectivity
docker-compose exec mysql mysql -u root -p$DB_PASSWORD rugby_control -e "SELECT 1"
```

---

## Production Deployment

### Architecture

```
Internet
    ↓
Cloudflare / AWS Route53 (DNS)
    ↓
Nginx (Reverse Proxy, SSL)
    ↓
Express.js API (Containerized)
    ↓
MySQL Database (RDS or Self-Hosted)
```

### Pre-Deployment Checklist

- [ ] Secured all sensitive credentials
- [ ] Set strong JWT_SECRET (256+ bits)
- [ ] Configured CORS_ORIGIN to production domain
- [ ] Set NODE_ENV=production
- [ ] Obtained SSL certificate
- [ ] Configured database backups
- [ ] Set up monitoring and alerts
- [ ] Load tested application
- [ ] Prepared rollback procedure

### AWS Deployment (ECS Recommended)

#### Using ECS with Docker

```bash
# 1. Create ECR repository
aws ecr create-repository --repository-name rugby-analytics

# 2. Build and push Docker image
docker build -t rugby-analytics .
docker tag rugby-analytics:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/rugby-analytics:latest
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/rugby-analytics:latest

# 3. Create ECS cluster and service
# Configure in AWS console or use CloudFormation

# 4. Deploy using CloudFormation
aws cloudformation create-stack \
  --stack-name rugby-analytics-prod \
  --template-body file://cloudformation.yaml
```

#### Using Docker Compose Deploy

```bash
# 1. Enable Docker Swarm
docker swarm init

# 2. Create production compose file
docker-compose -f docker-compose.yml -f docker-compose.prod.yml config

# 3. Deploy stack
docker stack deploy -c docker-compose.yml -c docker-compose.prod.yml rugby

# 4. Scale service
docker service scale rugby_app=3

# 5. Monitor
docker service ls
docker service logs rugby_app
```

### GCP Cloud Run Deployment

```bash
# 1. Configure project
export PROJECT_ID=your-project-id
gcloud config set project $PROJECT_ID

# 2. Build image
gcloud builds submit --tag gcr.io/$PROJECT_ID/rugby-analytics

# 3. Deploy to Cloud Run
gcloud run deploy rugby-analytics \
  --image gcr.io/$PROJECT_ID/rugby-analytics \
  --platform managed \
  --region us-central1 \
  --set-env-vars NODE_ENV=production,DB_HOST=$DB_CLOUD_SQL_INSTANCE \
  --memory 512Mi \
  --cpu 1

# 4. Test deployment
curl https://rugby-analytics-xxxxx.a.run.app/api/health
```

### Self-Hosted VPS Deployment

```bash
# 1. Provision VPS (Ubuntu 20.04+)
# Recommended: AWS t3.small, DigitalOcean $6/month

# 2. Install dependencies
sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io docker-compose git curl

# 3. Clone and setup
git clone <repo-url> /home/ubuntu/rugby-analytics
cd /home/ubuntu/rugby-analytics

# 4. Configure Nginx reverse proxy
sudo cp nginx.prod.conf /etc/nginx/sites-available/rugby-analytics
sudo ln -s /etc/nginx/sites-available/rugby-analytics /etc/nginx/sites-enabled/
sudo certbot certonly --webroot -w /var/www/html -d yourdomain.com
sudo systemctl restart nginx

# 5. Deploy
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# 6. Enable auto-updates
sudo systemctl enable docker
sudo systemctl enable docker.service

# 7. Setup monitoring
curl -sSfL https://get.docker.com/linux | sh
docker run -d --name prometheus prom/prometheus
```

---

## Database Management

### Backups

```bash
# Manual backup
docker-compose exec mysql mysqldump -u root -p$DB_PASSWORD rugby_control > backup-$(date +%Y%m%d-%H%M%S).sql

# Automated daily backups (add to crontab)
0 2 * * * docker-compose exec -T mysql mysqldump -u root -p$DB_PASSWORD rugby_control > /backups/backup-$(date +\%Y\%m\%d).sql

# Backup to S3
aws s3 cp backup.sql s3://your-backup-bucket/rugby-analytics/

# Restore from backup
docker-compose exec -T mysql mysql -u root -p$DB_PASSWORD rugby_control < backup.sql
```

### Database Migrations

```bash
# Check schema version
docker-compose exec mysql mysql -u root -p$DB_PASSWORD rugby_control -e "SELECT version FROM schema_version ORDER BY version DESC LIMIT 1"

# Apply migrations
docker-compose exec -T mysql mysql -u root -p$DB_PASSWORD rugby_control < migrations/001-initial-schema.sql

# Rollback
docker-compose down
# Restore from backup and restart
```

### Performance Optimization

```sql
-- Add indexes for common queries
CREATE INDEX idx_matches_status_date ON matches(status, match_date);
CREATE INDEX idx_events_match_time ON match_events(match_id, game_time);
CREATE INDEX idx_users_role ON users(role);

-- Monitor query performance
EXPLAIN SELECT * FROM matches WHERE status='live' ORDER BY created_at DESC;

-- Optimize table
OPTIMIZE TABLE matches;
ANALYZE TABLE matches;
```

---

## Monitoring & Logging

### Application Logs

```bash
# View logs
docker-compose logs -f app

# Save logs to file
docker-compose logs app > app.log

# Filter by log level
grep "ERROR" app.log

# Monitor specific endpoint
docker-compose logs app | grep "/api/auth/login"
```

### Performance Monitoring

```bash
# CPU and Memory usage
docker stats

# Database connections
docker-compose exec mysql mysql -u root -p$DB_PASSWORD -e "SHOW PROCESSLIST\G"

# Slow queries
docker-compose exec mysql mysql -u root -p$DB_PASSWORD -e "SELECT * FROM mysql.slow_log\G"
```

### Alerting Setup

```bash
# Using Prometheus and Alertmanager
docker run -d -p 9090:9090 -v /path/to/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus

# Health check API endpoint
GET /api/health
Response: { "status": "ok", "timestamp": "2026-03-20T...", "db": "connected" }
```

---

## Continuous Deployment

### GitHub Actions Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Run tests
        run: npm test

      - name: Build Docker image
        run: docker build -t rugby-analytics .

      - name: Push to registry
        run: |
          docker tag rugby-analytics ${{ secrets.REGISTRY }}/rugby-analytics
          docker push ${{ secrets.REGISTRY }}/rugby-analytics

      - name: Deploy to production
        run: |
          ssh -i ${{ secrets.SSH_KEY }} ubuntu@prod-server
          cd rugby-analytics
          git pull
          docker-compose pull
          docker-compose up -d
          docker-compose exec app npm run db:migrate
```

---

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs app

# Common issues:
# - Port already in use: change PORT in .env
# - Database not ready: wait longer, check mysql health
# - Environment variables missing: verify .env file

# Reset containers
docker-compose down -v
docker-compose up -d
```

### Database connection errors

```bash
# Test MySQL connection
docker-compose exec app mysql -h mysql -u root -p$DB_PASSWORD -e "SELECT 1"

# Check MySQL status
docker-compose ps mysql

# Restart MySQL
docker-compose restart mysql

# Check logs
docker-compose logs mysql
```

### High memory usage

```bash
# Check current usage
docker stats

# Increase memory limit in docker-compose.yml
# Or reduce number of replicas

# Clear unused containers/images
docker system prune -a
```

### SSL Certificate expiry

```bash
# Check expiry date
openssl s_client -connect yourdomain.com:443 -showcerts | grep -A 5 "notAfter"

# Renew certificate
sudo certbot renew --force-renewal

# Verify renewal
sudo systemctl restart nginx
```

---

## Scaling

### Horizontal Scaling

```bash
# Scale application instances
docker service scale rugby_app=3

# Load balancing with Nginx
# Configure upstream in nginx.conf:
upstream api_backend {
  server app1:3001;
  server app2:3001;
  server app3:3001;
}
```

### Vertical Scaling

```bash
# Increase resource allocation
# Update docker-compose.yml:
app:
  deploy:
    resources:
      limits:
        cpus: '4'
        memory: 2G
```

---

## Security Hardening

### HTTPS/TLS

```bash
# Install SSL certificate
sudo certbot certonly --nginx -d yourdomain.com

# Auto-renewal
sudo systemctl enable certbot.timer
```

### Environment Variables

```bash
# Use secrets management
# AWS Secrets Manager
aws secretsmanager create-secret --name rugby-analytics/prod/db-password

# .env file permissions
chmod 600 .env

# Never commit .env to git
echo ".env" >> .gitignore
```

### Database Security

```sql
-- Create limited user
CREATE USER 'rugby_app'@'%' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON rugby_control.* TO 'rugby_app'@'%';

-- Remove root remote access
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
FLUSH PRIVILEGES;
```

---

## Rollback Procedure

```bash
# Keep previous version
git tag v1.0.0-prod
docker tag rugby-analytics:latest rugby-analytics:v1.0.0-prod

# If deployment fails:
# 1. Stop current version
docker-compose down

# 2. Restore previous version
docker tag rugby-analytics:v1.0.0-prod rugby-analytics:latest

# 3. Restore database backup
docker-compose up -d mysql
mysql < backup-20260320.sql

# 4. Start application
docker-compose up -d app

# 5. Verify
curl https://yourdomain.com/api/health
```

---

## Support & Monitoring

### Uptime Monitoring
- [Uptime Robot](https://uptimerobot.com) - Free monitoring
- [Datadog](https://datadog.com) - Full observability
- [New Relic](https://newrelic.com) - APM monitoring

### Log Aggregation
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Splunk
- CloudWatch (AWS)
- Stackdriver (GCP)

### Incident Response
- Setup alerts for errors (>1% error rate)
- Page on-call engineer
- Automated rollback on failure
- Post-incident review process

---

## Deployment Checklist

```
Pre-Deployment:
- [ ] Tests passing (npm test)
- [ ] Linting passing (npm run lint)
- [ ] Code reviewed
- [ ] Database migrations tested
- [ ] Environment variables verified
- [ ] SSL certificate valid
- [ ] Backups created
- [ ] Team notified

Deployment:
- [ ] Scale down (if zero-downtime needed)
- [ ] Deploy new version
- [ ] Run database migrations
- [ ] Health checks passing
- [ ] Smoke tests passing
- [ ] Monitor logs for errors

Post-Deployment:
- [ ] Verify all endpoints
- [ ] Check database integrity
- [ ] Test user workflows
- [ ] Monitor metrics
- [ ] Document any issues
- [ ] Update status page
```

---

**Last Updated**: 2026-03-20
**Version**: 1.0.0
