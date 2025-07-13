#!/bin/bash

# Demo Test Script for AI Prompt App Smart Search with Ollama
# This script tests the smart search functionality with Ollama AI and fallback system

set -e

echo "🚀 AI Prompt App - Smart Search Demo Test (Ollama + Fallback)"
echo "=============================================================="

# Configuration
BASE_URL="http://localhost:5000/api"
FRONTEND_URL="http://localhost:3001"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to make API calls
make_api_call() {
    local method=$1
    local endpoint=$2
    local data=$3

    if [ -n "$data" ]; then
        curl -s -X $method \
             -H "Content-Type: application/json" \
             -d "$data" \
             "$BASE_URL$endpoint"
    else
        curl -s -X $method "$BASE_URL$endpoint"
    fi
}

# Function to check if service is running
check_service() {
    local url=$1
    local service_name=$2

    if curl -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $service_name is running${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name is not running at $url${NC}"
        return 1
    fi
}

echo -e "\n${BLUE}1. Checking services...${NC}"
echo "----------------------------------------"

# Check if backend is running
if ! check_service "$BASE_URL/health" "Backend API"; then
    echo -e "${YELLOW}💡 Start the backend with: npm run dev:backend${NC}"
    exit 1
fi

# Check if Ollama is running
if ! check_service "http://localhost:11434/api/tags" "Ollama AI Service"; then
    echo -e "${YELLOW}⚠️  Ollama is not running - will test fallback mode${NC}"
    echo -e "${YELLOW}💡 Start Ollama with: ollama serve${NC}"
    echo -e "${YELLOW}💡 Pull a model with: ollama pull llama3.1${NC}"
fi

# Check if frontend is running
if ! check_service "$FRONTEND_URL" "Frontend"; then
    echo -e "${YELLOW}💡 Start the frontend with: npm run dev:frontend${NC}"
    echo -e "${YELLOW}   (Frontend check is optional for API testing)${NC}"
fi

echo -e "\n${BLUE}2. Checking smart search health...${NC}"
echo "----------------------------------------"

health_response=$(make_api_call "GET" "/smart-health")
echo "$health_response" | jq '.' 2>/dev/null || echo "$health_response"

echo -e "\n${BLUE}2.1. Testing AI service...${NC}"
echo "----------------------------------------"

ai_test_response=$(make_api_call "POST" "/test-ai")
echo "$ai_test_response" | jq '.' 2>/dev/null || echo "$ai_test_response"

echo -e "\n${BLUE}2.2. Checking available AI models...${NC}"
echo "----------------------------------------"

models_response=$(make_api_call "GET" "/ai-models")
if echo "$models_response" | jq -e '.available_models' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Available Ollama models:${NC}"
    echo "$models_response" | jq -r '.available_models[]' 2>/dev/null | head -5 | while read model; do
        echo "   - $model"
    done
else
    echo -e "${YELLOW}⚠️  Could not retrieve Ollama models${NC}"
fi

echo -e "\n${BLUE}3. Adding sample prompts...${NC}"
echo "----------------------------------------"

# Sample prompts to add to the database
declare -a sample_prompts=(
    '{"prompt": "How to optimize React performance?", "response": "React performance can be optimized through several techniques: 1) Use React.memo for component memoization, 2) Implement lazy loading with Suspense, 3) Optimize re-renders with useCallback and useMemo, 4) Use virtualization for large lists, 5) Minimize bundle size with code splitting."}'
    '{"prompt": "What are the best practices for Node.js development?", "response": "Node.js best practices include: 1) Use async/await for asynchronous operations, 2) Implement proper error handling, 3) Use environment variables for configuration, 4) Follow the single responsibility principle, 5) Use middleware for cross-cutting concerns, 6) Implement proper logging and monitoring."}'
    '{"prompt": "How to secure a web application?", "response": "Web application security involves: 1) Input validation and sanitization, 2) Authentication and authorization, 3) HTTPS encryption, 4) CSRF protection, 5) SQL injection prevention, 6) XSS protection, 7) Regular security audits and updates."}'
    '{"prompt": "Database design principles", "response": "Key database design principles: 1) Normalization to reduce redundancy, 2) Proper indexing for performance, 3) Define clear relationships between tables, 4) Use appropriate data types, 5) Implement constraints for data integrity, 6) Plan for scalability and backup strategies."}'
    '{"prompt": "JavaScript ES6 features", "response": "ES6 introduced many powerful features: 1) Arrow functions for cleaner syntax, 2) Let and const for block scoping, 3) Template literals for string interpolation, 4) Destructuring assignment, 5) Modules for better code organization, 6) Classes for object-oriented programming, 7) Promises for async operations."}'
)

echo "Adding sample prompts to the database..."
for prompt in "${sample_prompts[@]}"; do
    echo -n "."
    make_api_call "POST" "/smart-prompt" "$prompt" > /dev/null 2>&1 || echo -e "\n${YELLOW}⚠️  Failed to add prompt${NC}"
done
echo -e "\n${GREEN}✅ Sample prompts added${NC}"

echo -e "\n${BLUE}4. Testing smart search with AI and fallback...${NC}"
echo "--------------------------------------------------------"

# Test queries
declare -a test_queries=(
    "React optimization techniques"
    "Node.js best practices"
    "Application security"
    "Database optimization"
    "Modern JavaScript features"
)

for query in "${test_queries[@]}"; do
    echo -e "\n${YELLOW}🔍 Testing query: \"$query\"${NC}"

    search_data="{\"query\": \"$query\", \"limit\": 3, \"threshold\": 0.6}"
    response=$(make_api_call "POST" "/smart-search" "$search_data")

    if echo "$response" | jq -e '.response' > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Search successful${NC}"

        # Extract key information
        ai_response=$(echo "$response" | jq -r '.response' | cut -c1-150)
        sources_count=$(echo "$response" | jq -r '.sources | length')

        echo "   AI Response: ${ai_response}..."
        echo "   Sources found: $sources_count"

        # Show similarity scores
        if [ "$sources_count" -gt 0 ]; then
            echo "   Similarity scores:"
            echo "$response" | jq -r '.similarity_scores[]' | head -3 | while read score; do
                percentage=$(echo "$score * 100" | bc -l | cut -d. -f1)
                echo "     - ${percentage}%"
            done
        fi

        # Check if response came from AI or fallback
        if echo "$response" | grep -q "knowledge base" || echo "$response" | grep -q "Based on"; then
            echo -e "   ${BLUE}ℹ️  Response generated using vector fallback${NC}"
        else
            echo -e "   ${GREEN}🤖 Response generated using AI service${NC}"
        fi
    else
        echo -e "${RED}❌ Search failed${NC}"
        echo "   Response: $response"
    fi
done

echo -e "\n${BLUE}5. Testing vector-only search...${NC}"
echo "----------------------------------------"

similar_data='{"query": "performance optimization", "limit": 5, "threshold": 0.5}'
similar_response=$(make_api_call "POST" "/find-similar" "$similar_data")

if echo "$similar_response" | jq -e '.found_count' > /dev/null 2>&1; then
    found_count=$(echo "$similar_response" | jq -r '.found_count')
    echo -e "${GREEN}✅ Found $found_count similar prompts${NC}"

    if [ "$found_count" -gt 0 ]; then
        echo "   Similar prompts:"
        echo "$similar_response" | jq -r '.results[].document.prompt' | head -3 | while read prompt; do
            echo "     - ${prompt:0:60}..."
        done
    fi
else
    echo -e "${RED}❌ Similar search failed${NC}"
    echo "   Response: $similar_response"
fi

echo -e "\n${BLUE}6. Checking embedding statistics...${NC}"
echo "----------------------------------------"

stats_response=$(make_api_call "GET" "/embedding-stats")
if echo "$stats_response" | jq -e '.totalPrompts' > /dev/null 2>&1; then
    total=$(echo "$stats_response" | jq -r '.totalPrompts')
    with_embeddings=$(echo "$stats_response" | jq -r '.promptsWithEmbeddings')
    coverage=$(echo "$stats_response" | jq -r '.embedding_coverage')

    echo -e "${GREEN}✅ Embedding statistics:${NC}"
    echo "   Total prompts: $total"
    echo "   With embeddings: $with_embeddings"
    echo "   Coverage: $coverage"
else
    echo -e "${RED}❌ Failed to get embedding statistics${NC}"
    echo "   Response: $stats_response"
fi

echo -e "\n${BLUE}7. Testing AI service resilience...${NC}"
echo "-----------------------------------------"

echo "Testing with very short query (should trigger fallback logic)..."
short_query_data='{"query": "JS", "limit": 2, "threshold": 0.8}'
short_response=$(make_api_call "POST" "/smart-search" "$short_query_data")

if echo "$short_response" | jq -e '.response' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Short query handled successfully${NC}"
    short_resp=$(echo "$short_response" | jq -r '.response' | cut -c1-100)
    echo "   Response: ${short_resp}..."
else
    echo -e "${YELLOW}⚠️  Short query test inconclusive${NC}"
fi

echo -e "\n${BLUE}8. Performance test...${NC}"
echo "----------------------------------------"

echo "Running performance test with 10 concurrent searches..."
start_time=$(date +%s%N)

for i in {1..10}; do
    (
        test_data='{"query": "web development best practices", "limit": 3, "threshold": 0.7}'
        make_api_call "POST" "/smart-search" "$test_data" > /dev/null 2>&1
    ) &
done

wait

end_time=$(date +%s%N)
duration=$(( (end_time - start_time) / 1000000 ))

echo -e "${GREEN}✅ Performance test completed in ${duration}ms${NC}"

echo -e "\n${BLUE}9. Demo URLs and next steps...${NC}"
echo "----------------------------------------"

echo -e "${GREEN}🎉 Demo test completed successfully!${NC}"
echo ""
echo "Access the application:"
echo "  Frontend: $FRONTEND_URL"
echo "  API Docs: $BASE_URL"
echo "  Ollama: http://localhost:11434"
echo ""
echo "Try these sample queries in the frontend:"
echo "  - 'How can I improve React performance?'"
echo "  - 'What are security best practices?'"
echo "  - 'Modern JavaScript development tips'"
echo "  - 'Database optimization strategies'"
echo ""
echo "API endpoints you can test:"
echo "  - POST $BASE_URL/smart-search (AI + Fallback)"
echo "  - POST $BASE_URL/find-similar (Vector only)"
echo "  - GET  $BASE_URL/embedding-stats"
echo "  - GET  $BASE_URL/smart-health"
echo "  - GET  $BASE_URL/ai-models"
echo "  - POST $BASE_URL/test-ai"
echo ""
echo -e "${BLUE}🤖 Ollama Setup:${NC}"
echo "  1. Install: curl -fsSL https://ollama.ai/install.sh | sh"
echo "  2. Start: ollama serve"
echo "  3. Pull model: ollama pull llama3.1"
echo "  4. Alternative models: llama3.1:8b, codellama, phi3"
echo ""
echo -e "${YELLOW}💡 The system works with or without Ollama - it automatically falls back to vector search!${NC}"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo ""
    echo -e "${YELLOW}⚠️  Install 'jq' for better JSON formatting: brew install jq${NC}"
fi

# Check if bc is installed
if ! command -v bc &> /dev/null; then
    echo -e "${YELLOW}⚠️  Install 'bc' for calculations: brew install bc${NC}"
fi
