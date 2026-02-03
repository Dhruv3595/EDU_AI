# 🚀 EduAI - Complete Setup Guide

This guide will walk you through setting up the EduAI project on your local machine and deploying it to production.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Database Setup](#database-setup)
4. [Running the Application](#running-the-application)
5. [Production Deployment](#production-deployment)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software

1. **Node.js 18+**
   ```bash
   # Check if installed
   node --version
   
   # Download from: https://nodejs.org/
   ```

2. **Python 3.10+**
   ```bash
   # Check if installed
   python --version
   
   # Download from: https://www.python.org/downloads/
   ```

3. **PostgreSQL 15+**
   ```bash
   # macOS (using Homebrew)
   brew install postgresql@15
   brew services start postgresql@15
   
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install postgresql-15
   
   # Windows
   # Download from: https://www.postgresql.org/download/windows/
   ```

4. **Git**
   ```bash
   # Check if installed
   git --version
   
   # Download from: https://git-scm.com/downloads
   ```

## Local Development Setup

### Step 1: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/yourusername/eduai.git

# Navigate to project directory
cd eduai
```

### Step 2: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Frontend Setup

```bash
# Open a new terminal and navigate to frontend
cd frontend

# Install dependencies
npm install
```

## Database Setup

### Step 1: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE eduai;

# Create user (optional)
CREATE USER eduai_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE eduai TO eduai_user;

# Exit
\q
```

### Step 2: Configure Environment Variables

Create `.env` file in the backend directory:

```bash
cd backend
cp .env.example .env
```

Edit `.env` file:

```env
# Database Configuration
DATABASE_URL=postgresql+asyncpg://postgres:your_password@localhost:5432/eduai

# Security
SECRET_KEY=your-super-secret-key-change-this-in-production

# Application Settings
DEBUG=True
PORT=8000
```

### Step 3: Initialize Database Tables

```bash
# Make sure you're in backend directory and virtual environment is activated

# Install alembic if not already installed
pip install alembic

# Initialize migrations (if not already done)
alembic init migrations

# Create initial migration
alembic revision --autogenerate -m "Initial migration"

# Apply migrations
alembic upgrade head
```

## Running the Application

### Option 1: Using Concurrently (Recommended)

Install a process manager to run both frontend and backend:

```bash
# Install concurrently globally
npm install -g concurrently

# From the root directory, create a start script
# Add to package.json in root:
```

Create `package.json` in root directory:

```json
{
  "name": "eduai",
  "version": "1.0.0",
  "scripts": {
    "dev": "concurrently \"cd backend && uvicorn main:app --reload\" \"cd frontend && npm run dev\"",
    "install:all": "npm install && cd frontend && npm install && cd ../backend && pip install -r requirements.txt"
  },
  "devDependencies": {
    "concurrently": "^8.2.0"
  }
}
```

Then run:

```bash
# Install root dependencies
npm install

# Start both services
npm run dev
```

### Option 2: Manual Start

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Production Deployment

### Frontend Deployment (Vercel)

#### Step 1: Prepare for Deployment

```bash
# Create vercel.json in frontend directory
cd frontend
cat > vercel.json << EOF
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
EOF
```

#### Step 2: Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

Or connect your GitHub repository to Vercel:

1. Go to [vercel.com](https://vercel.com)
2. Sign up/login with GitHub
3. Click "New Project"
4. Import your repository
5. Configure:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add Environment Variables:
   - `VITE_API_URL`: Your backend URL
7. Deploy

### Backend Deployment (Render)

#### Step 1: Prepare for Deployment

Create `render.yaml` in backend directory:

```yaml
services:
  - type: web
    name: eduai-backend
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: eduai-db
          property: connectionString
      - key: SECRET_KEY
        generateValue: true
      - key: PYTHON_VERSION
        value: 3.10.0

databases:
  - name: eduai-db
    databaseName: eduai
    user: eduai
```

#### Step 2: Deploy to Render

1. Go to [render.com](https://render.com)
2. Sign up/login with GitHub
3. Click "New +" → "Blueprint"
4. Connect your repository
5. Render will detect `render.yaml` and deploy

### Database Deployment (Supabase)

#### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up/login
3. Click "New Project"
4. Choose organization, name project "eduai"
5. Set database password
6. Choose region closest to your users
7. Create project

#### Step 2: Get Connection String

1. Go to Project Settings → Database
2. Copy "Connection string" (URI format)
3. Update your backend `.env`:

```env
DATABASE_URL=postgresql+asyncpg://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

### Alternative: Deploy Everything to Railway

Railway can deploy both frontend and backend together:

1. Go to [railway.app](https://railway.app)
2. Sign up/login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. Railway will auto-detect and deploy

## GitHub Repository Setup

### Step 1: Initialize Git Repository

```bash
# From project root
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit"
```

### Step 2: Create GitHub Repository

```bash
# Create repository on GitHub (via web or CLI)
# Then link and push:

git remote add origin https://github.com/yourusername/eduai.git
git branch -M main
git push -u origin main
```

### Step 3: Add Project Structure

```bash
# Create necessary directories
mkdir -p docs screenshots

# Add a LICENSE file
cat > LICENSE << EOF
MIT License

Copyright (c) 2025 EduAI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Error

```
Error: connection to server at "localhost" failed
```

**Solution:**
```bash
# Check if PostgreSQL is running
# macOS:
brew services list | grep postgresql

# Ubuntu:
sudo systemctl status postgresql

# Start PostgreSQL if not running
# macOS:
brew services start postgresql@15

# Ubuntu:
sudo systemctl start postgresql
```

#### 2. CORS Error in Frontend

```
Access to fetch at 'http://localhost:8000/...' from origin 'http://localhost:5173'
```

**Solution:**
Backend CORS is already configured in `main.py`. If issues persist:

```python
# In backend/main.py, update CORS origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 3. Module Not Found Error

```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution:**
```bash
# Ensure virtual environment is activated
source backend/venv/bin/activate

# Reinstall dependencies
pip install -r backend/requirements.txt
```

#### 4. npm install fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Getting Help

If you encounter issues not covered here:

1. Check the logs:
   - Backend: Terminal running uvicorn
   - Frontend: Browser console (F12)

2. Verify environment variables are set correctly

3. Ensure all services are running:
   - PostgreSQL
   - Backend (port 8000)
   - Frontend (port 5173)

4. Create an issue on GitHub with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version, Python version)

## 🎉 Next Steps

After successful setup:

1. **Create Admin User**: Use the admin API to create an admin account
2. **Add Content**: Add subjects, questions, and resources via admin panel
3. **Test Features**: Try assessments, study plans, and AI tutor
4. **Customize**: Modify themes, add new features
5. **Deploy**: Push to production when ready

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Happy Learning with EduAI! 🎓**
