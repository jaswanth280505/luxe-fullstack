# 🚀 Deployment Guide — Luxe E-Commerce Full Stack

## Architecture for Lakhs of Concurrent Users

```
USER (Lakhs) ──► Vercel CDN (Global Edge) ──► React App (static, cached)
                                               │
                                               ▼ API calls
               Railway Load Balancer ──► Spring Boot Instance(s)
                                               │
                                               ▼
                                       Railway MySQL (Managed)
                                       HikariCP Connection Pool
```

**Why this scales:**
- **Vercel**: Deploys React as static files to 100+ edge nodes globally. No server-side rendering bottleneck. Millions of concurrent users supported out of the box.
- **Railway**: Auto-scales Spring Boot Docker containers. Add more instances with one click. Each instance handles ~500-1000 concurrent requests.
- **HikariCP**: Connection pooling (pool size 20) prevents DB overload. 20 connections serve thousands of requests via async/queued access.
- **MySQL on Railway**: Managed, auto-backups, monitored. Upgrade to Railway Pro for more connections.

---

## 📋 Step-by-Step Setup

### STEP 1 — Create GitHub Repository

1. Go to https://github.com/new
2. Create repo: `luxe-fullstack` (private recommended)
3. Push this project:
   ```bash
   git init
   git remote add origin https://github.com/YOUR_ORG/luxe-fullstack.git
   git add .
   git commit -m "feat: initial full stack project"
   git push -u origin main
   ```

### STEP 2 — Create Team Branches

```bash
git checkout -b dev && git push -u origin dev
git checkout -b staging && git push -u origin staging
```

### STEP 3 — Set Branch Protection Rules

In GitHub: **Settings → Branches → Add rule**

For `main`:
- ✅ Require pull request reviews
- ✅ Require status checks: `backend-ci`, `frontend-ci`, `docker-validate`
- ✅ Require branches to be up to date
- ✅ Require linear history

For `staging`:
- ✅ Require pull request reviews
- ✅ Require status checks to pass

For `dev`:
- ✅ Require pull request reviews

### STEP 4 — Set Up Railway (Backend + Database)

1. Go to https://railway.app → Sign up with GitHub
2. Create **New Project**
3. Add **MySQL** database service:
   - Click **+ New** → **Database** → **MySQL**
   - Railway creates a managed MySQL instance
   - Copy the **DATABASE_URL** from the Variables tab

4. Add **Backend** service:
   - Click **+ New** → **GitHub Repo** → Select `luxe-fullstack`
   - Set **Root Directory** to `/backend`
   - Railway detects Dockerfile automatically

5. Set Backend Environment Variables (Railway Dashboard → Variables):
   ```
   DB_URL         = jdbc:mysql://HOST:PORT/luxe_ecommerce?useSSL=true&serverTimezone=UTC
   DB_USERNAME    = (from MySQL service)
   DB_PASSWORD    = (from MySQL service)
   JWT_SECRET     = (generate: openssl rand -base64 64)
   ALLOWED_ORIGINS = https://luxe.vercel.app
   PORT            = 8080
   ```

6. Repeat for **Staging** environment:
   - Railway supports multiple environments per project
   - Create "staging" environment in Railway dashboard

7. Get **Railway Token**:
   - Go to Account Settings → Tokens → Create Token
   - Save as GitHub Secret: `RAILWAY_TOKEN`

8. Get **Service IDs**:
   - Go to each service → Settings → Copy Service ID
   - Save as `RAILWAY_SERVICE_ID_PROD` and `RAILWAY_SERVICE_ID_STAGING`

### STEP 5 — Set Up Vercel (Frontend)

1. Go to https://vercel.com → Sign up with GitHub
2. Click **Add New Project** → Import `luxe-fullstack`
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

4. Set Environment Variables in Vercel:
   ```
   VITE_API_BASE_URL = https://luxe-api.railway.app/api
   VITE_ENV          = production
   ```

5. Get Vercel credentials:
   - Vercel Dashboard → Settings → Tokens → Create Token → Save as `VERCEL_TOKEN`
   - Project Settings → Copy Project ID → Save as `VERCEL_PROJECT_ID`  
   - Team Settings → Copy Team/Org ID → Save as `VERCEL_ORG_ID`

### STEP 6 — Add All GitHub Secrets

**GitHub → Settings → Secrets and variables → Actions → New repository secret:**

```
RAILWAY_TOKEN                 ← From Railway account settings
RAILWAY_SERVICE_ID_PROD       ← From Railway production service
RAILWAY_SERVICE_ID_STAGING    ← From Railway staging service
VERCEL_TOKEN                  ← From Vercel account settings
VERCEL_ORG_ID                 ← From Vercel team settings
VERCEL_PROJECT_ID             ← From Vercel project settings
SONAR_TOKEN                   ← From SonarCloud (optional)
```



### STEP 8 — First Deploy



GitHub Actions will:
1. Run all CI tests
2. Build Docker image → push to GHCR
3. Deploy to Railway → run health checks
4. Deploy frontend → Vercel production
5. Run smoke tests
6. Create GitHub Release

---



## 📈 Scaling for Lakhs of Users

| Users | Strategy |
|---|---|
| Up to 10,000 | Single Railway instance (default) |
| 10K – 100K | Railway auto-scale (2-5 instances) |
| 100K – 1M | Railway Pro + Read replicas for MySQL |
| 1M+ | Add Redis caching + CDN for API responses |

### Railway Auto-Scaling Setup
In Railway service settings:
- Enable **Auto-scaling**
- Min instances: 1
- Max instances: 10
- Scale trigger: CPU > 70% OR Memory > 80%

### MySQL Connection Scaling
Each backend instance uses `maximum-pool-size=20`.
With 10 instances = 200 total DB connections.
Railway MySQL Pro supports 500+ connections.

---

## 🩺 Monitoring & Observability

| Endpoint | URL |
|---|---|
| Health Check | `GET /api/actuator/health` |
| App Info | `GET /api/actuator/info` |
| Metrics | `GET /api/actuator/metrics` |
| Swagger UI | `GET /api/swagger-ui.html` |

Railway Dashboard provides:
- Real-time CPU and memory graphs
- Request logs with filtering
- Database query metrics
- Deployment history with rollback
