# 🐳 Docker Quick Start Guide

## Overview

This guide helps you quickly set up the AI Prompt Application with Ollama integration using Docker. Everything runs in containers for easy deployment and testing.

## 🚀 Quick Start (TL;DR)

```bash
# 1. Clone and navigate to project
cd ai-prompt-app

# 2. Set up environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 3. Run complete setup
chmod +x docker-setup.sh
./docker-setup.sh setup

# 4. Visit http://localhost:3001
```

## 📋 What's Included

When you run `docker-compose up -d`, you get:

- **🤖 Ollama Service** (`localhost:11434`) - Local AI with llama3.1:latest model
- **🗃️ MongoDB** (`localhost:27017`) - Vector database for prompts
- **🔧 Backend API** (`localhost:3000`/`5000`) - Smart search endpoints
- **🌐 Frontend** (`localhost:3001`) - React application
- **📱 Mongo Express** (`localhost:8081`) - Database admin interface

## 🛠️ Setup Options

### Option 1: Automated Setup (Recommended)
```bash
./docker-setup.sh setup
```

### Option 2: Manual Setup
```bash
# Build and start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### Option 3: Development Mode
```bash
# Start with hot reloading
./docker-setup.sh dev

# Or manually
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

## 📦 Service Details

### Ollama AI Service
- **Container**: `ai-prompt-ollama`
- **Port**: `11434`
- **Model**: `llama3.1:latest` (auto-downloaded)
- **Volume**: `ollama_data` (persistent model storage)

### Application Stack
- **Backend**: Node.js/Express with TypeScript
- **Frontend**: React with Vite and Tailwind CSS
- **Database**: MongoDB with vector search
- **AI Integration**: Ollama + OpenAI embeddings

## 🔧 Environment Configuration

### Required Variables
```bash
# .env file
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=mongodb://admin:password123@mongodb:27017/ai_prompt_app?authSource=admin
```

### Optional Ollama Settings
```bash
OLLAMA_ENDPOINT=http://ollama:11434
OLLAMA_MODEL=llama3.1:latest
OLLAMA_TEMPERATURE=0.7
OLLAMA_MAX_TOKENS=500
OLLAMA_TIMEOUT=30000
```

## 🧪 Testing the Setup

### Quick Health Check
```bash
# Using the management script
./docker-setup.sh status

# Manual checks
curl http://localhost:11434/api/tags          # Ollama
curl http://localhost:3000/api/health         # Backend
curl http://localhost:3001                    # Frontend
```

### Run Full Test Suite
```bash
./docker-setup.sh test

# Or manually
./demo-test.sh
```

## 📊 Management Commands

### Using the Management Script
```bash
./docker-setup.sh setup      # Complete setup
./docker-setup.sh start      # Start services
./docker-setup.sh stop       # Stop services
./docker-setup.sh status     # Check status
./docker-setup.sh logs       # View all logs
./docker-setup.sh logs app   # View app logs only
./docker-setup.sh dev        # Development mode
./docker-setup.sh clean      # Remove everything
```

### Manual Docker Commands
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
docker-compose logs -f ollama

# Rebuild images
docker-compose build --no-cache

# Remove everything
docker-compose down -v --rmi all
```

## 🤖 Ollama Model Management

### Available Models
```bash
# List models in container
docker-compose exec ollama ollama list

# Pull new models
docker-compose exec ollama ollama pull phi3
docker-compose exec ollama ollama pull codellama

# Check model size before pulling
curl -s http://localhost:11434/api/tags
```

### Model Switching
```bash
# Update environment variable
export OLLAMA_MODEL=phi3

# Restart services
docker-compose restart app
```

### Popular Models by Use Case
| Model | Size | Best For | RAM Required |
|-------|------|----------|--------------|
| `phi3` | 2.3GB | Speed/Efficiency | 4GB+ |
| `llama3.1:8b` | 4.7GB | Balanced | 8GB+ |
| `llama3.1:latest` | 4.7GB | General Use | 8GB+ |
| `codellama` | 3.8GB | Code Tasks | 6GB+ |
| `llama3.1:70b` | 40GB | Highest Quality | 64GB+ |

## 🐛 Troubleshooting

### Common Issues

#### "Ollama service not ready"
```bash
# Check Ollama container
docker-compose logs ollama

# Restart Ollama
docker-compose restart ollama

# Pull model manually
docker-compose exec ollama ollama pull llama3.1:latest
```

#### "Model not found"
```bash
# Check available models
docker-compose exec ollama ollama list

# Pull the required model
docker-compose exec ollama ollama pull llama3.1:latest
```

#### "Backend connection failed"
```bash
# Check backend logs
docker-compose logs app

# Verify environment variables
docker-compose exec app env | grep OLLAMA
```

#### "Out of memory / Slow responses"
```bash
# Switch to smaller model
docker-compose exec ollama ollama pull phi3

# Update environment
echo "OLLAMA_MODEL=phi3" >> .env
docker-compose restart app
```

### Resource Requirements

#### Minimum System Requirements
- **RAM**: 8GB (for llama3.1:8b)
- **Disk**: 10GB free space
- **CPU**: 4 cores recommended

#### Recommended for Best Performance
- **RAM**: 16GB+
- **Disk**: 20GB+ free space
- **CPU**: 8 cores+
- **GPU**: CUDA-compatible (optional, for GPU acceleration)

### Performance Optimization

#### For Limited Resources
```bash
# Use lightweight model
OLLAMA_MODEL=phi3
OLLAMA_MAX_TOKENS=200
OLLAMA_TEMPERATURE=0.3
```

#### For Maximum Quality
```bash
# Use large model (requires 64GB+ RAM)
OLLAMA_MODEL=llama3.1:70b
OLLAMA_MAX_TOKENS=1000
OLLAMA_TEMPERATURE=0.7
```

## 📈 Monitoring

### Container Health
```bash
# Check container status
docker-compose ps

# Monitor resource usage
docker stats

# Check logs
docker-compose logs -f --tail=100
```

### Application Health
```bash
# API health check
curl http://localhost:3000/api/smart-health | jq

# Ollama health
curl http://localhost:11434/api/tags | jq

# Database health
docker-compose exec mongodb mongosh --eval "db.runCommand('ping')"
```

## 🔄 Development Workflow

### Hot Reloading Setup
```bash
# Start in development mode
./docker-setup.sh dev

# This gives you:
# - Frontend hot reloading (Vite)
# - Backend hot reloading (nodemon)
# - Source code mounted as volumes
# - Development ports (5000 for backend)
```

### Code Changes
1. Edit files in `frontend/` or `backend/`
2. Changes are automatically reflected
3. No need to rebuild containers

### Adding Dependencies
```bash
# Install new npm packages
docker-compose exec app npm install package-name

# Rebuild if needed
docker-compose build app
```

## 🚀 Production Deployment

### Build for Production
```bash
# Build optimized images
docker-compose build

# Start in production mode
docker-compose up -d
```

### Environment Security
```bash
# Generate secure secrets
JWT_SECRET=$(openssl rand -base64 32)
MONGO_ROOT_PASSWORD=$(openssl rand -base64 32)

# Update .env file with secure values
```

## 📝 Logs and Debugging

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f ollama
docker-compose logs -f app
docker-compose logs -f mongodb

# Last 100 lines
docker-compose logs --tail=100 app
```

### Debug Container Issues
```bash
# Enter container shell
docker-compose exec app sh
docker-compose exec ollama bash

# Check environment variables
docker-compose exec app env

# Test network connectivity
docker-compose exec app ping ollama
```

## 🔧 Customization

### Custom Ollama Models
```bash
# Add custom model to docker-compose.yml
services:
  ollama-pull:
    command: >
      sh -c "
        ollama pull llama3.1:latest &&
        ollama pull your-custom-model &&
        echo 'Custom models ready!'
      "
```

### Custom Environment
```bash
# Create .env.local for local overrides
cp .env .env.local
# Edit .env.local with your specific settings
```

### Volume Persistence
- **ollama_data**: Stores downloaded models (persistent)
- **mongodb_data**: Stores database (persistent)
- **Source code**: Mounted for development (live changes)

## 🎯 Next Steps

1. **Visit the Application**: http://localhost:3001
2. **Test Smart Search**: Try asking questions about React, Node.js, etc.
3. **Monitor Performance**: Watch logs and system resources
4. **Experiment with Models**: Try different Ollama models
5. **Add Content**: Use the app to build your knowledge base

## 🆘 Getting Help

- **View service status**: `./docker-setup.sh status`
- **Run tests**: `./docker-setup.sh test`
- **Check logs**: `./docker-setup.sh logs`
- **Clean restart**: `./docker-setup.sh clean && ./docker-setup.sh setup`

## 📚 Additional Resources

- [Ollama Documentation](https://ollama.ai/docs)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [MongoDB Docker](https://hub.docker.com/_/mongo)
- [Project Documentation](./SMART_SEARCH_README.md)