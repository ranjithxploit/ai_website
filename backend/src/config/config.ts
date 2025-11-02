import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

interface Config {
  env: string;
  port: number;
  mongodb: {
    uri: string;
  };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
  };
  gemini: {
    apiKey: string;
  };
  upload: {
    maxFileSize: number;
    uploadPath: string;
    allowedTypes: string[];
  };
  security: {
    bcryptRounds: number;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    authRateLimitMax: number;
    generationRateLimitMax: number;
  };
  cors: {
    origin: string;
  };
  logging: {
    level: string;
    filePath: string;
  };
  libreoffice: {
    path: string;
  };
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/qwerty',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'change-this-secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'change-this-secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    uploadPath: process.env.UPLOAD_PATH || path.join(__dirname, '../../uploads'),
    allowedTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
  },
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
    authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5', 10),
    generationRateLimitMax: parseInt(process.env.GENERATION_RATE_LIMIT_MAX || '10', 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filePath: process.env.LOG_FILE_PATH || path.join(__dirname, '../../logs'),
  },
  libreoffice: {
    path: process.env.LIBREOFFICE_PATH || '/usr/bin/libreoffice',
  },
};

// Validate critical environment variables
const validateConfig = () => {
  const requiredVars = [
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'GEMINI_API_KEY',
    'MONGODB_URI',
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0 && config.env === 'production') {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (config.env === 'production') {
    if (config.jwt.accessSecret.length < 32 || config.jwt.refreshSecret.length < 32) {
      throw new Error('JWT secrets must be at least 32 characters in production');
    }
  }
};

validateConfig();

export default config;
