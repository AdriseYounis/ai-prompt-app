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
COPY backend/tsconfig.json backend/

# Build frontend
RUN npm run build:frontend

# Build backend
RUN npm run build:backend

# Production stage
FROM node:18-alpine
WORKDIR /app

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

# Expose ports
EXPOSE 3000 3001

# Start both services
CMD ["./scripts/start.sh"]
