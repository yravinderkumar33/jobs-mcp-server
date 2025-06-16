// Load environment variables first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const mongoose = require('mongoose');
const RouteGenerator = require('./lib/route-generator');

// Configuration - All values now come from environment variables with sensible defaults
const config = {
  server: {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  api: {
    version: process.env.API_VERSION || '1.0',
    title: process.env.API_TITLE || 'OpenAPI Backend'
  },
  paths: {
    openApiSpec: process.env.OPENAPI_SPEC_PATH 
      ? path.resolve(process.env.OPENAPI_SPEC_PATH) 
      : path.join(__dirname, 'open-api-spec.yaml'),
    controllers: process.env.CONTROLLERS_PATH 
      ? path.resolve(process.env.CONTROLLERS_PATH) 
      : path.join(__dirname, 'controllers')
  },
  request: {
    bodyLimit: process.env.REQUEST_BODY_LIMIT || '10mb',
    urlEncodedExtended: process.env.REQUEST_URL_ENCODED_EXTENDED === 'true' || true
  },
  features: {
    corsEnabled: process.env.CORS_ENABLED !== 'false',
    logRequests: process.env.LOG_REQUESTS !== 'false'  
  },
  endpoints: {
    healthCheck: process.env.HEALTH_CHECK_ENDPOINT || '/health',
    apiDocs: process.env.API_DOCS_ENDPOINT || '/api-docs'
  }
};

// Validate critical paths
if (!require('fs').existsSync(config.paths.openApiSpec)) {
  console.error(`❌ OpenAPI spec file not found: ${config.paths.openApiSpec}`);
  process.exit(1);
}

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/jobs', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Create Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS middleware (configurable)
if (config.features.corsEnabled) {
  app.use(cors());
}

// Body parsing middleware
app.use(express.json({ limit: config.request.bodyLimit }));
app.use(express.urlencoded({ 
  extended: config.request.urlEncodedExtended,
  limit: config.request.bodyLimit 
}));

// Request logging middleware (configurable)
if (config.features.logRequests) {
  app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// Health check endpoint (configurable path)
app.get(config.endpoints.healthCheck, (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: require('./package.json').version,
    environment: config.server.nodeEnv,
    api: {
      version: config.api.version,
      title: config.api.title
    }
  });
});

// API documentation endpoint (configurable path)
app.get(config.endpoints.apiDocs, (req, res) => {
  const fs = require('fs');
  try {
    const specContent = fs.readFileSync(config.paths.openApiSpec, 'utf8');
    res.type('text/yaml').send(specContent);
  } catch (error) {
    console.error('❌ Failed to load API specification:', error.message);
    res.status(500).json({ 
      error: 'Could not load API specification',
      message: error.message 
    });
  }
});

// Initialize route generator with configuration
const routeGenerator = new RouteGenerator({
  specPath: config.paths.openApiSpec,
  controllersPath: config.paths.controllers,
  apiVersion: config.api.version
});

// Load OpenAPI spec
if (!routeGenerator.loadSpec()) {
  console.error('❌ Failed to load OpenAPI specification. Exiting...');
  process.exit(1);
}

// Generate controller template if it doesn't exist
routeGenerator.generateControllerTemplate();

// Load existing controller
routeGenerator.loadController();

// Generate routes from OpenAPI spec
console.log('🚀 Generating routes from OpenAPI specification...\n');
routeGenerator.generateRoutes(app);

// Handle 404 for unmatched routes
app.use('*', (req, res) => {
  res.status(404).json({
    id: 'not-found',
    ver: config.api.version,
    ets: Date.now(),
    params: {
      msgid: require('crypto').randomUUID(),
      err: 'NOT_FOUND',
      status: 'FAILED',
      errmsg: `Route ${req.method} ${req.originalUrl} not found`
    },
    responseCode: 'NOT_FOUND',
    result: {}
  });
});

// Enhanced global error handler
app.use((error, req, res, next) => {
  console.error('❌ Unhandled error:', error);
  
  // Don't leak error details in production
  const errorMessage = config.server.nodeEnv === 'production' 
    ? 'An internal server error occurred'
    : error.message;
  
  res.status(500).json({
    id: 'internal-error',
    ver: config.api.version,
    ets: Date.now(),
    params: {
      msgid: require('crypto').randomUUID(),
      err: 'INTERNAL_ERROR',
      status: 'FAILED',
      errmsg: errorMessage
    },
    responseCode: 'INTERNAL_ERROR',
    result: {}
  });
});

// Start server
app.listen(config.server.port, () => {
  console.log(`
🎉 ${config.api.title} started successfully!

📍 Server running on: http://localhost:${config.server.port}
🌍 Environment: ${config.server.nodeEnv}
📊 Health check: http://localhost:${config.server.port}${config.endpoints.healthCheck}  
📖 API docs: http://localhost:${config.server.port}${config.endpoints.apiDocs}
📁 Controllers directory: ${config.paths.controllers}
📄 OpenAPI spec: ${config.paths.openApiSpec}
🔧 Configuration loaded from environment variables
  `);
});

// Graceful shutdown handlers
const gracefulShutdown = (signal) => {
  console.log(`🛑 ${signal} received, shutting down gracefully`);
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app; 