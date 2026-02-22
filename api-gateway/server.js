const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
require('dotenv').config();
const authMiddleware = require('./middleware/auth');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8000;
const isProduction = process.env.NODE_ENV === 'production';

const requiredEnv = ['DATABASE_URL', 'SUPABASE_JWT_SECRET', 'FRONTEND_URL'];
if (isProduction) {
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length) {
    // eslint-disable-next-line no-console
    console.error(`Ambiente de produção inválido. Variáveis ausentes: ${missing.join(', ')}`);
    process.exit(1);
  }
}

// Security middleware
app.use(helmet());
app.disable('x-powered-by');

// Trust reverse proxy (nginx) for correct client IP handling
app.set('trust proxy', 1);

// Enable CORS for our frontend
const defaultOrigins = ['http://localhost:3000', 'http://localhost:8080'];
const envOrigin = process.env.FRONTEND_URL;
const envOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];
const allowedOrigins = [
  ...envOrigins,
  envOrigin,
  ...(isProduction ? [] : defaultOrigins)
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser requests
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS bloqueado para origem: ${origin}`));
  },
  credentials: true
}));

// Rate limiting (mais permissivo em preview para evitar 429 no dashboard)
const isPreviewEnv = process.env.NODE_ENV === 'preview' || process.env.PREVIEW_MODE === 'true';
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX || (isPreviewEnv ? 1000 : 200))
});
app.use(limiter);

const tenantLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_TENANT_MAX || (isPreviewEnv ? 1500 : 300)),
  keyGenerator: (req) => req.user?.id || req.ip
});

// Parse JSON bodies
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging setup
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'api-gateway' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.headers['x-user-id'] || null
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    service: 'API Gateway',
    timestamp: new Date().toISOString() 
  });
});

// Assistente de setup (sem auth)
app.use('/api/setup', require('./routes/setup'));

// Auth + tenant identification middleware (Supabase-compatible)
app.use('/api', authMiddleware, tenantLimiter);

// Placeholder routes for various services
// These would be replaced with actual proxy logic to backend services
app.use('/api/devices', require('./routes/devices'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/pops', require('./routes/pops'));
app.use('/api/providers', require('./routes/providers'));
app.use('/api/alerts', require('./routes/alerts'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/users', require('./routes/users'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/discovery', require('./routes/discovery'));
app.use('/api/network', require('./routes/network'));
app.use('/api/tools', require('./routes/tools'));

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.message, err);
  
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Handle 404s
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start the server
app.listen(PORT, () => {
  logger.info(`API Gateway listening on port ${PORT}`);
});

module.exports = app;
