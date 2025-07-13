#!/bin/bash

# AI Prompt App - Docker Setup and Management Script
# This script helps you set up and manage the Docker environment with Ollama integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose.yml"
COMPOSE_DEV_FILE="docker-compose.dev.yml"
ENV_FILE=".env"
ENV_EXAMPLE_FILE=".env.example"

# Functions
print_header() {
    echo -e "${BLUE}"
    echo "======================================"
    echo "🤖 AI Prompt App - Docker Setup"
    echo "======================================"
    echo -e "${NC}"
}

print_section() {
    echo -e "\n${PURPLE}$1${NC}"
    echo "--------------------------------------"
}

check_dependencies() {
    print_section "🔍 Checking dependencies..."

    local missing_deps=()

    # Check Docker
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi

    # Check Docker Compose
    if ! docker compose version &> /dev/null && ! docker-compose --version &> /dev/null; then
        missing_deps+=("docker-compose")
    fi

    # Check curl
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        echo -e "${RED}❌ Missing dependencies: ${missing_deps[*]}${NC}"
        echo -e "${YELLOW}Please install the missing dependencies and try again.${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ All dependencies found${NC}"
}

check_env_file() {
    print_section "📄 Checking environment configuration..."

    if [ ! -f "$ENV_FILE" ]; then
        echo -e "${YELLOW}⚠️  .env file not found${NC}"

        if [ -f "$ENV_EXAMPLE_FILE" ]; then
            echo -e "${BLUE}📋 Copying .env.example to .env${NC}"
            cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"
            echo -e "${YELLOW}⚠️  Please edit .env file and add your OpenAI API key${NC}"
            echo -e "${YELLOW}   Required: OPENAI_API_KEY=your_key_here${NC}"
        else
            echo -e "${RED}❌ No .env.example file found${NC}"
            exit 1
        fi
    else
        echo -e "${GREEN}✅ .env file exists${NC}"
    fi

    # Check for required environment variables
    if grep -q "OPENAI_API_KEY=sk-your_openai_api_key_here_replace_this_text" "$ENV_FILE" 2>/dev/null || \
       grep -q "OPENAI_API_KEY=your_openai_api_key_here" "$ENV_FILE" 2>/dev/null || \
       ! grep -q "OPENAI_API_KEY=sk-" "$ENV_FILE" 2>/dev/null; then
        echo -e "${YELLOW}⚠️  Please update OPENAI_API_KEY in .env file with a valid OpenAI API key${NC}"
        echo -e "${YELLOW}   Format: OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx${NC}"
    else
        echo -e "${GREEN}✅ OpenAI API key configured${NC}"
    fi
}

build_images() {
    print_section "🔨 Building Docker images..."

    echo -e "${BLUE}Building production images...${NC}"
    docker compose -f "$COMPOSE_FILE" build --no-cache

    if [ -f "$COMPOSE_DEV_FILE" ]; then
        echo -e "${BLUE}Building development images...${NC}"
        docker compose -f "$COMPOSE_FILE" -f "$COMPOSE_DEV_FILE" build --no-cache
    fi

    echo -e "${GREEN}✅ Images built successfully${NC}"
}

start_services() {
    local mode=$1
    print_section "🚀 Starting services in $mode mode..."

    if [ "$mode" = "development" ]; then
        docker compose -f "$COMPOSE_FILE" -f "$COMPOSE_DEV_FILE" up -d
    else
        docker compose -f "$COMPOSE_FILE" up -d
    fi

    echo -e "${GREEN}✅ Services started${NC}"
}

wait_for_services() {
    print_section "⏳ Waiting for services to be ready..."

    local max_attempts=60
    local attempt=1

    # Wait for MongoDB
    echo -e "${BLUE}Checking MongoDB...${NC}"
    while [ $attempt -le $max_attempts ]; do
        if docker compose exec mongodb mongosh --eval "db.runCommand('ping')" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ MongoDB is ready${NC}"
            break
        fi
        echo -e "${YELLOW}Attempt $attempt/$max_attempts - MongoDB not ready yet...${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done

    # Wait for Ollama
    attempt=1
    echo -e "${BLUE}Checking Ollama...${NC}"
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Ollama is ready${NC}"
            break
        fi
        echo -e "${YELLOW}Attempt $attempt/$max_attempts - Ollama not ready yet...${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done

    # Wait for Application
    attempt=1
    echo -e "${BLUE}Checking Application...${NC}"
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:5000/api/health >/dev/null 2>&1 || curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
            echo -e "${GREEN}✅ Application is ready${NC}"
            break
        fi
        echo -e "${YELLOW}Attempt $attempt/$max_attempts - Application not ready yet...${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done
}

check_ollama_model() {
    print_section "🤖 Checking Ollama model..."

    if curl -s http://localhost:11434/api/tags | grep -q "llama3.1:latest"; then
        echo -e "${GREEN}✅ llama3.1:latest model is available${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  llama3.1:latest model not found${NC}"
        echo -e "${BLUE}📥 Pulling model (this may take several minutes)...${NC}"

        docker compose exec ollama ollama pull llama3.1:latest

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Model pulled successfully${NC}"
        else
            echo -e "${RED}❌ Failed to pull model${NC}"
            return 1
        fi
    fi
}

show_status() {
    print_section "📊 Service Status"

    # Check Docker containers
    echo -e "${BLUE}Docker Containers:${NC}"
    docker compose ps

    echo -e "\n${BLUE}Service URLs:${NC}"
    echo -e "🌐 Frontend:        http://localhost:3001"
    echo -e "🔧 Backend API:     http://localhost:5000 (dev) / http://localhost:3000 (prod)"
    echo -e "🤖 Ollama:          http://localhost:11434"
    echo -e "🗃️  MongoDB:         mongodb://localhost:27017"
    echo -e "📱 Mongo Express:   http://localhost:8081 (admin/password123)"

    echo -e "\n${BLUE}Health Checks:${NC}"

    # Check services
    if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        echo -e "🤖 Ollama:          ${GREEN}✅ Running${NC}"

        # List available models
        models=$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | cut -d'"' -f4 | head -5)
        if [ -n "$models" ]; then
            echo -e "   Available models: $(echo $models | tr '\n' ', ' | sed 's/,$//')"
        fi
    else
        echo -e "🤖 Ollama:          ${RED}❌ Not running${NC}"
    fi

    if curl -s http://localhost:5000/api/health >/dev/null 2>&1; then
        echo -e "🔧 Backend API:     ${GREEN}✅ Running (dev port)${NC}"
    elif curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
        echo -e "🔧 Backend API:     ${GREEN}✅ Running (prod port)${NC}"
    else
        echo -e "🔧 Backend API:     ${RED}❌ Not running${NC}"
    fi

    if curl -s http://localhost:3001 >/dev/null 2>&1; then
        echo -e "🌐 Frontend:        ${GREEN}✅ Running${NC}"
    else
        echo -e "🌐 Frontend:        ${RED}❌ Not running${NC}"
    fi

    if docker compose exec mongodb mongosh --eval "db.runCommand('ping')" >/dev/null 2>&1; then
        echo -e "🗃️  MongoDB:         ${GREEN}✅ Running${NC}"
    else
        echo -e "🗃️  MongoDB:         ${RED}❌ Not running${NC}"
    fi
}

show_logs() {
    local service=$1
    print_section "📋 Showing logs for $service"

    if [ -z "$service" ]; then
        docker compose logs -f
    else
        docker compose logs -f "$service"
    fi
}

stop_services() {
    print_section "🛑 Stopping services..."

    docker compose down

    echo -e "${GREEN}✅ Services stopped${NC}"
}

cleanup() {
    print_section "🧹 Cleaning up..."

    echo -e "${YELLOW}This will remove all containers, volumes, and images. Continue? (y/N)${NC}"
    read -r response

    if [[ "$response" =~ ^[Yy]$ ]]; then
        docker compose down -v --rmi all
        docker system prune -f
        echo -e "${GREEN}✅ Cleanup completed${NC}"
    else
        echo -e "${BLUE}ℹ️  Cleanup cancelled${NC}"
    fi
}

test_system() {
    print_section "🧪 Testing system functionality..."

    echo -e "${BLUE}Testing API endpoints...${NC}"

    # Test health endpoint
    if curl -s http://localhost:5000/api/health >/dev/null 2>&1 || curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Health endpoint working${NC}"
    else
        echo -e "${RED}❌ Health endpoint failed${NC}"
    fi

    # Test smart health endpoint
    if curl -s http://localhost:5000/api/smart-health >/dev/null 2>&1 || curl -s http://localhost:3000/api/smart-health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Smart health endpoint working${NC}"
    else
        echo -e "${RED}❌ Smart health endpoint failed${NC}"
    fi

    # Test Ollama integration
    if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Ollama integration working${NC}"
    else
        echo -e "${RED}❌ Ollama integration failed${NC}"
    fi

    echo -e "\n${BLUE}Running comprehensive test...${NC}"
    if [ -f "./demo-test.sh" ]; then
        chmod +x ./demo-test.sh
        ./demo-test.sh
    else
        echo -e "${YELLOW}⚠️  demo-test.sh not found${NC}"
    fi
}

show_help() {
    echo -e "${BLUE}AI Prompt App - Docker Management Script${NC}"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup       Complete setup (check deps, build, start)"
    echo "  build       Build Docker images"
    echo "  start       Start services in production mode"
    echo "  dev         Start services in development mode"
    echo "  stop        Stop all services"
    echo "  restart     Restart all services"
    echo "  status      Show service status and URLs"
    echo "  logs        Show logs for all services"
    echo "  logs <service>  Show logs for specific service"
    echo "  test        Test system functionality"
    echo "  clean       Clean up all containers and volumes"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 setup       # Complete setup"
    echo "  $0 dev         # Start in development mode"
    echo "  $0 logs app    # Show app logs"
    echo "  $0 status      # Check service status"
}

# Main script logic
main() {
    case "${1:-help}" in
        setup)
            print_header
            check_dependencies
            check_env_file
            build_images
            start_services "production"
            wait_for_services
            check_ollama_model
            show_status
            echo -e "\n${GREEN}🎉 Setup completed successfully!${NC}"
            echo -e "${BLUE}Visit http://localhost:3001 to use the application${NC}"
            ;;
        build)
            print_header
            check_dependencies
            build_images
            ;;
        start)
            print_header
            check_dependencies
            start_services "production"
            wait_for_services
            show_status
            ;;
        dev)
            print_header
            check_dependencies
            check_env_file
            start_services "development"
            wait_for_services
            show_status
            ;;
        stop)
            print_header
            stop_services
            ;;
        restart)
            print_header
            stop_services
            start_services "production"
            wait_for_services
            show_status
            ;;
        status)
            print_header
            show_status
            ;;
        logs)
            show_logs "$2"
            ;;
        test)
            print_header
            test_system
            ;;
        clean)
            print_header
            cleanup
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            echo -e "${RED}Unknown command: $1${NC}"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
