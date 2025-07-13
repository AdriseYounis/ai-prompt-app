# Smart Search System Documentation

## Overview

The Smart Search system enhances the AI Prompt App with vector embeddings and intelligent search capabilities. It uses OpenAI's `text-embedding-3-small` model to create embeddings for prompts and provides contextual responses based on similarity search.

## Features

### 🔍 Vector-Based Search
- Converts text prompts into high-dimensional vectors using OpenAI embeddings
- Performs similarity search using cosine similarity
- Finds semantically similar prompts even with different wording

### 🧠 AI-Powered Responses
- Generates intelligent responses based on similar prompts in the database
- Uses GPT-3.5-turbo for contextual response generation
- Provides source attribution with similarity scores

### 📊 Analytics & Migration
- Embedding statistics and coverage reporting
- Batch migration of existing prompts to include embeddings
- Health checks for system components

## API Endpoints

### Smart Search
```
POST /api/smart-search
Content-Type: application/json

{
  "query": "How to optimize database performance?",
  "limit": 5,        // Optional: max results (default: 5)
  "threshold": 0.7   // Optional: similarity threshold (default: 0.7)
}
```

**Response:**
```json
{
  "response": "Based on your question about database optimization...",
  "sources": [
    {
      "_id": "...",
      "prompt": "Database optimization techniques",
      "response": "Here are key strategies...",
      "embedding": [...],
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ],
  "similarity_scores": [0.85, 0.78, 0.72]
}
```

### Enhanced Prompt Saving
```
POST /api/smart-prompt
Content-Type: application/json

{
  "prompt": "What is machine learning?",
  "response": "Machine learning is a subset of AI..."
}
```

**Response:**
```json
{
  "id": "64f8b4c2e1234567890abcdef",
  "message": "Prompt saved successfully with embedding",
  "prompt": "What is machine learning?",
  "response": "Machine learning is a subset of AI..."
}
```

### Find Similar Prompts
```
POST /api/find-similar
Content-Type: application/json

{
  "query": "JavaScript frameworks",
  "limit": 3,
  "threshold": 0.6
}
```

**Response:**
```json
{
  "query": "JavaScript frameworks",
  "found_count": 2,
  "results": [
    {
      "document": { ... },
      "similarity_score": 0.82,
      "similarity_percentage": "82.0%"
    }
  ]
}
```

### System Management

#### Migrate Existing Prompts
```
POST /api/migrate-embeddings
```

#### Get Embedding Statistics
```
GET /api/embedding-stats
```

**Response:**
```json
{
  "totalPrompts": 100,
  "promptsWithEmbeddings": 75,
  "promptsWithoutEmbeddings": 25,
  "embedding_coverage": "75.00%"
}
```

#### Health Check
```
GET /api/smart-health
```

## Setup Instructions

### 1. Environment Variables
Create a `.env` file with the following variables:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here
MONGODB_URI=mongodb://localhost:27017/ai_prompt_app
PORT=5000

# Optional
NODE_ENV=development
JWT_SECRET=your_jwt_secret_here
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start the Server
```bash
npm run dev
```

### 4. Migrate Existing Data (Optional)
If you have existing prompts without embeddings:

```bash
curl -X POST http://localhost:5000/api/migrate-embeddings
```

## Technical Details

### Embedding Model
- **Model**: `text-embedding-3-small`
- **Dimensions**: 1536
- **Use Case**: General purpose text embeddings

### Vector Similarity
- **Algorithm**: Cosine similarity
- **Range**: 0.0 to 1.0 (higher = more similar)
- **Default Threshold**: 0.7

### Performance Considerations
- **Batch Processing**: Embeddings are generated in batches of 10
- **Rate Limiting**: Built-in delays to respect OpenAI rate limits
- **Caching**: Embeddings are stored in MongoDB for reuse
- **Indexing**: Database indexes on embedding fields for performance

## Error Handling

### Common Issues

1. **Missing OpenAI API Key**
   ```json
   {
     "error": "OPENAI_API_KEY environment variable is required"
   }
   ```

2. **Invalid Embedding**
   ```json
   {
     "error": "Failed to generate embedding"
   }
   ```

3. **Database Connection**
   ```json
   {
     "error": "MongoDB not connected yet"
   }
   ```

### Troubleshooting

1. **Check API Key**: Ensure your OpenAI API key is valid and has sufficient credits
2. **Database Connection**: Verify MongoDB is running and accessible
3. **Dependencies**: Run `npm install` to ensure all packages are installed
4. **Logs**: Check server logs for detailed error messages

## Usage Examples

### Basic Search
```javascript
const response = await fetch('/api/smart-search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'How to handle authentication in React?'
  })
});

const data = await response.json();
console.log(data.response); // AI-generated response
console.log(data.sources);  // Similar prompts from database
```

### Save New Prompt
```javascript
const response = await fetch('/api/smart-prompt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'Explain Docker containers',
    response: 'Docker containers are lightweight, portable...'
  })
});

const data = await response.json();
console.log(data.id); // New prompt ID
```

### Check System Health
```javascript
const response = await fetch('/api/smart-health');
const health = await response.json();

console.log(health.openai_configured);    // true/false
console.log(health.database_connected);   // true/false
console.log(health.embedding_service);    // true/false
```

## Best Practices

1. **Query Optimization**: Use specific, well-formed queries for better results
2. **Threshold Tuning**: Adjust similarity threshold based on your use case
3. **Batch Operations**: Use migration endpoint for bulk embedding generation
4. **Error Handling**: Always handle API errors gracefully
5. **Rate Limits**: Be mindful of OpenAI API rate limits for high-volume usage

## Security Notes

- Never hardcode API keys in client-side code
- Use environment variables for sensitive configuration
- Implement proper error handling to avoid exposing internal details
- Consider rate limiting for public-facing endpoints

## Future Enhancements

- [ ] Support for different embedding models
- [ ] Fuzzy text matching fallback
- [ ] Caching layer for frequently accessed embeddings
- [ ] Advanced filtering and sorting options
- [ ] Real-time embedding updates
- [ ] Multi-language support