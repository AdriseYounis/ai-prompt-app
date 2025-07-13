# 🔑 OpenAI API Key Setup Guide

## Overview
This guide helps you obtain and configure an OpenAI API key for the AI Prompt Application. The API key is required for generating embeddings that power the vector search functionality.

## 🚀 Quick Setup

### Step 1: Get Your OpenAI API Key

1. **Visit OpenAI Platform**: Go to [https://platform.openai.com](https://platform.openai.com)

2. **Create/Login to Account**: 
   - Sign up for a new account or login to existing one
   - You may need to verify your phone number

3. **Navigate to API Keys**:
   - Click on your profile in the top-right corner
   - Select "View API keys" or go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

4. **Create New API Key**:
   - Click "Create new secret key"
   - Give it a name like "AI Prompt App"
   - Copy the key immediately (you won't see it again!)

### Step 2: Add Credits to Your Account

1. **Go to Billing**: [https://platform.openai.com/account/billing](https://platform.openai.com/account/billing)

2. **Add Payment Method**: Add a credit card or payment method

3. **Add Credits**: Add at least $5-10 for testing
   - Embedding costs are very low (~$0.0001 per 1K tokens)
   - $5 will last for thousands of queries

### Step 3: Configure Your Application

1. **Update .env file**:
   ```bash
   # Replace the placeholder with your actual key
   OPENAI_API_KEY=sk-proj-your_actual_key_here
   ```

2. **Verify the format**:
   - Should start with `sk-proj-` (new format) or `sk-` (legacy)
   - Should be ~51+ characters long
   - No spaces or quotes needed

## 💰 Cost Breakdown

### What You'll Pay For
- **Embeddings**: $0.0001 per 1K tokens (~750 words)
- **No charges for Ollama**: The local AI model is completely free

### Example Costs
- **100 prompts**: ~$0.01-0.05
- **1,000 prompts**: ~$0.10-0.50  
- **10,000 prompts**: ~$1.00-5.00

### Cost Optimization Tips
- Embeddings are only generated once per prompt
- Costs are minimal for typical usage
- Most expensive part is initial embedding of existing data

## 🔧 Configuration Examples

### Minimal .env Setup
```bash
# Required
PORT=5000
MONGODB_URI=mongodb://admin:password123@mongodb:27017/ai_prompt_app?authSource=admin&directConnection=true
OPENAI_API_KEY=sk-proj-your_actual_key_here

# Optional Ollama settings (defaults shown)
OLLAMA_ENDPOINT=http://ollama:11434
OLLAMA_MODEL=llama3.1:latest
```

### Full .env Setup
```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://admin:password123@mongodb:27017/ai_prompt_app?authSource=admin&directConnection=true

# OpenAI Configuration (for embeddings)
OPENAI_API_KEY=sk-proj-your_actual_key_here

# Ollama Configuration (Primary AI Provider)
OLLAMA_ENDPOINT=http://ollama:11434
OLLAMA_MODEL=llama3.1:latest
OLLAMA_TEMPERATURE=0.7
OLLAMA_MAX_TOKENS=500
OLLAMA_TIMEOUT=30000

# Optional
JWT_SECRET=your_jwt_secret_here
```

## 🧪 Testing Your API Key

### Option 1: Use the Docker Setup
```bash
# Update .env with your key, then run:
./docker-setup.sh setup
```

### Option 2: Quick API Test
```bash
# Test your API key directly
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer sk-proj-your_actual_key_here"
```

### Option 3: Application Health Check
```bash
# Start the app and check
curl http://localhost:5000/api/smart-health
```

## 🚨 Troubleshooting

### "Invalid API Key" Error
```bash
# Check your key format
echo $OPENAI_API_KEY
# Should start with sk-proj- or sk-

# Verify no extra spaces
grep OPENAI_API_KEY .env
```

### "Insufficient Credits" Error
1. Go to [OpenAI Billing](https://platform.openai.com/account/billing)
2. Add a payment method
3. Purchase credits ($5 minimum)

### "Rate Limited" Error
- OpenAI has rate limits for new accounts
- Wait a few minutes and try again
- Consider upgrading your OpenAI plan

### "API Key Not Found" Error
```bash
# Make sure .env file exists and has the key
cat .env | grep OPENAI_API_KEY

# Restart the application after updating .env
docker-compose restart app
```

## 🔒 Security Best Practices

### Environment Variables
```bash
# ✅ Good - in .env file
OPENAI_API_KEY=sk-proj-your_key_here

# ❌ Bad - hardcoded in code
const apiKey = "sk-proj-your_key_here"
```

### .gitignore Protection
Make sure `.env` is in your `.gitignore`:
```gitignore
# Environment variables
.env
.env.local
.env.production
```

### Key Rotation
- Rotate your API keys regularly
- Delete unused keys from OpenAI dashboard
- Monitor usage in OpenAI dashboard

## 📊 Monitoring Usage

### OpenAI Dashboard
1. Visit [https://platform.openai.com/usage](https://platform.openai.com/usage)
2. Monitor your token usage
3. Set up billing alerts

### Application Monitoring
```bash
# Check embedding statistics
curl http://localhost:5000/api/embedding-stats

# View application logs
docker-compose logs app
```

## 🆓 Free Alternatives

### If You Don't Want to Use OpenAI
The application can work without OpenAI for embeddings, but with reduced functionality:

1. **Disable embeddings** in the code
2. **Use text-based search** only
3. **Ollama still works** for AI responses

### Local Embedding Models
Future versions may support local embedding models like:
- **Sentence Transformers**
- **BGE embeddings**
- **Local embedding APIs**

## ✅ Verification Checklist

Before proceeding, ensure:

- [ ] OpenAI account created and verified
- [ ] API key generated and copied
- [ ] Payment method added to OpenAI account
- [ ] Credits added (minimum $5)
- [ ] `.env` file updated with actual API key
- [ ] API key starts with `sk-proj-` or `sk-`
- [ ] No spaces or quotes around the key
- [ ] `.env` file is not committed to git

## 🎯 Next Steps

Once your API key is configured:

1. **Run the setup**: `./docker-setup.sh setup`
2. **Test the system**: Visit http://localhost:3001
3. **Add some prompts**: Build your knowledge base
4. **Try smart search**: Ask questions and see AI responses
5. **Monitor usage**: Keep an eye on OpenAI costs

## 🆘 Need Help?

- **OpenAI Documentation**: [https://platform.openai.com/docs](https://platform.openai.com/docs)
- **OpenAI Support**: [https://help.openai.com](https://help.openai.com)
- **Check system status**: `./docker-setup.sh status`
- **View logs**: `./docker-setup.sh logs`

Your API key is the only external dependency - once configured, you'll have a powerful AI system running entirely on your machine! 🚀