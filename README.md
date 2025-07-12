# AI Prompt Application

A containerized application for interacting with AI models through a simple interface.

## Features

- React frontend with Tailwind CSS
- Node.js Express backend
- Containerized with Docker and Docker Compose
- Easy to extend and customize

## Project Structure

```
ai-prompt-app/
├── backend/             # Backend Node.js Express application
│   ├── src/             # Source code
│   │   ├── index.ts     # Main entry point
│   │   └── types.ts     # TypeScript type definitions
│   └── tsconfig.json    # TypeScript configuration for backend
├── frontend/            # Frontend React application
│   ├── src/             # Source code
│   │   ├── App.tsx      # Main React component
│   │   ├── main.tsx     # React entry point
│   │   └── index.css    # Styles with Tailwind
│   └── index.html       # HTML template
├── scripts/             # Helper scripts
│   ├── init-mongo.js    # MongoDB initialization
│   └── start.sh         # Container startup script
├── .dockerignore        # Docker ignore file
├── Dockerfile           # Multi-stage Docker build
├── docker-compose.yml   # Docker Compose configuration
├── package.json         # Project dependencies and scripts
├── postcss.config.js    # PostCSS configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── vite.config.ts       # Vite configuration
```

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) v18+ (for local development)
- [npm](https://www.npmjs.com/) v9+ (for local development)

## Getting Started

### Using Docker (recommended)

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ai-prompt-app
   ```

2. Create a `.env` file in the root directory with your API keys:
   ```
   OPENAI_API_KEY=your_openai_api_key
   JWT_SECRET=your_jwt_secret
   ```

3. Build and start the containers:
   ```bash
   docker-compose up --build
   ```

4. Access the application:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000
   - API Health Check: http://localhost:3000/api/health

### Local Development

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd ai-prompt-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development servers:
   ```bash
   npm run dev
   ```

4. Access the application:
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000

## Available Scripts

- `npm run dev`: Start development servers for both frontend and backend
- `npm run dev:frontend`: Start frontend development server
- `npm run dev:backend`: Start backend development server
- `npm run build`: Build both frontend and backend for production
- `npm run build:frontend`: Build frontend for production
- `npm run build:backend`: Build backend for production
- `npm run start`: Start production server
- `npm run preview`: Preview production build

## API Endpoints

- `GET /api/health`: Health check endpoint
- `POST /api/prompt`: Submit a prompt to the AI model
  - Request body: `{ "prompt": "Your prompt text here" }`
  - Response: `{ "response": "AI model response" }`

## Customization

### Adding New API Endpoints

1. Open `backend/src/index.ts`
2. Add new routes following the existing pattern
3. Implement your custom logic

### Extending the Frontend

1. Modify components in `frontend/src/`
2. Add new components as needed
3. Update the UI with Tailwind CSS classes

## Deployment

The application is containerized and ready for deployment to any environment that supports Docker.

### Environment Variables

- `NODE_ENV`: Environment (development, production)
- `PORT`: Backend port (default: 3000)
- `FRONTEND_PORT`: Frontend port (default: 3001)
- `OPENAI_API_KEY`: Your OpenAI API key
- `JWT_SECRET`: Secret for JWT authentication
