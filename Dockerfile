# Build stage
FROM node:18-alpine as builder
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy configuration files
COPY vite.config.ts tsconfig.json ./
COPY postcss.config.js tailwind.config.js ./
COPY frontend frontend/
COPY backend backend/

# Build frontend
RUN npm run build:frontend

# Build backend
RUN npm run build:backend

# Production stage
FROM node:18-alpine
WORKDIR /app

# Install system dependencies including curl for health checks
RUN apk add --no-cache curl

# Install serve for frontend
RUN npm install -g serve

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY scripts ./scripts

# Set permissions for start script
RUN chmod +x ./scripts/start.sh

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV FRONTEND_PORT=3001
ENV OLLAMA_ENDPOINT=http://ollama:11434
ENV OLLAMA_MODEL=llama3.1:latest
ENV OLLAMA_TEMPERATURE=0.7
ENV OLLAMA_MAX_TOKENS=500
ENV OLLAMA_TIMEOUT=30000

# Expose ports
EXPOSE 3000 3001

# Add health check for the application
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${PORT}/api/health || exit 1

# Start both services - use production start script
CMD ["npm", "run", "start:prod"]
