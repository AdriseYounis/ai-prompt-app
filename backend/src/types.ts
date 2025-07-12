import { Request } from 'express';

export interface TypedRequest<T> extends Request {
  body: T;
}

export interface PromptRequest {
  prompt: string;
}

export interface PromptResponse {
  response: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  environment: string;
}

export interface ErrorResponse {
  error: string;
}

export interface Config {
  port: number;
  mongoUri: string;
  nodeEnv: string;
  jwtSecret: string;
  openaiApiKey: string;
}

export interface MongoConfig {
  uri: string;
  options: {
    useNewUrlParser: boolean;
    useUnifiedTopology: boolean;
    serverSelectionTimeoutMS: number;
    maxPoolSize: number;
  };
}
