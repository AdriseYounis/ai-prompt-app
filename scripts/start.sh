#!/bin/sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting AI Prompt Application...${NC}"

# Function to wait for Ollama service
wait_for_ollama() {
    echo -e "${YELLOW}⏳ Waiting for Ollama service to be ready...${NC}"

    OLLAMA_HOST=${OLLAMA_ENDPOINT:-http://ollama:11434}
    MAX_ATTEMPTS=60
    ATTEMPT=1

    while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
        if curl -s "${OLLAMA_HOST}/api/tags" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Ollama service is ready!${NC}"
            return 0
        fi

        echo -e "${YELLOW}Attempt $ATTEMPT/$MAX_ATTEMPTS - Ollama not ready yet...${NC}"
        sleep 2
        ATTEMPT=$((ATTEMPT + 1))
    done

    echo -e "${RED}❌ Ollama service failed to start within timeout${NC}"
    echo -e "${YELLOW}⚠️  Application will start with fallback mode enabled${NC}"
    return 1
}

# Function to check if model is available
check_ollama_model() {
    OLLAMA_HOST=${OLLAMA_ENDPOINT:-http://ollama:11434}
    MODEL=${OLLAMA_MODEL:-llama3.1:latest}

    echo -e "${BLUE}🔍 Checking if model $MODEL is available...${NC}"

    if curl -s "${OLLAMA_HOST}/api/tags" | grep -q "$MODEL"; then
        echo -e "${GREEN}✅ Model $MODEL is available${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  Model $MODEL not found, but service will continue${NC}"
        return 1
    fi
}

# Wait for Ollama service (optional, continues even if fails)
if [ -n "$OLLAMA_ENDPOINT" ]; then
    wait_for_ollama
    check_ollama_model
else
    echo -e "${YELLOW}ℹ️  Ollama endpoint not configured, skipping Ollama checks${NC}"
fi

echo -e "${BLUE}🌐 Starting frontend server...${NC}"
# Start frontend in background
serve -s dist/frontend -l ${FRONTEND_PORT:-3001} &
FRONTEND_PID=$!

echo -e "${BLUE}🔧 Starting backend API server...${NC}"
# Start backend
node dist/backend/server.js &
BACKEND_PID=$!

echo -e "${GREEN}🎉 Application started successfully!${NC}"
echo -e "${GREEN}   Frontend: http://localhost:${FRONTEND_PORT:-3001}${NC}"
echo -e "${GREEN}   Backend API: http://localhost:${PORT:-3000}${NC}"
if [ -n "$OLLAMA_ENDPOINT" ]; then
    echo -e "${GREEN}   Ollama: ${OLLAMA_ENDPOINT}${NC}"
fi

# Handle graceful shutdown
trap 'echo -e "${YELLOW}🛑 Shutting down gracefully...${NC}"; kill $FRONTEND_PID $BACKEND_PID; exit' SIGINT SIGTERM

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
