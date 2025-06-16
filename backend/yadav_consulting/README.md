# Blue Collar Jobs API - OpenAPI-Driven Backend

A generalized OpenAPI specification-driven backend using Node.js and Express that automatically generates routes and controller templates based on your OpenAPI spec.

## ✨ Features

- 🚀 **Auto-generated routes** from OpenAPI specification
- 📁 **Dynamic controller loading** with template generation
- 🔧 **Fully configurable** via environment variables
- 🛡️ **Security-first** with Helmet and configurable CORS
- 📊 **Health monitoring** with detailed health checks
- 🎯 **Production-ready** with graceful shutdown and error handling
- 📖 **Self-documenting** API with built-in documentation endpoint

## 🛠️ Installation

```bash
npm install
```

## ⚙️ Configuration

The application is now fully configurable via environment variables. Copy the example environment file:

```bash
cp env.example .env
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| **Server Configuration** |
| `PORT` | `3000` | Server port number |
| `NODE_ENV` | `development` | Environment (development/production) |
| **API Configuration** |
| `API_VERSION` | `1.0` | API version for responses |
| `API_TITLE` | `OpenAPI Backend` | API title displayed in logs |
| **File Paths** |
| `OPENAPI_SPEC_PATH` | `./open-api-spec.yaml` | Path to OpenAPI specification file |
| `CONTROLLERS_PATH` | `./controllers` | Directory containing controller files |
| `CONTROLLER_FILE_NAME` | `apiController.js` | Name of the main controller file |
| **Request Configuration** |
| `REQUEST_BODY_LIMIT` | `10mb` | Maximum request body size |
| `REQUEST_URL_ENCODED_EXTENDED` | `true` | Enable extended URL encoding |
| **Features** |
| `CORS_ENABLED` | `true` | Enable/disable CORS middleware |
| `LOG_REQUESTS` | `true` | Enable/disable request logging |
| **Controller Template** |
| `CONTROLLER_TEMPLATE_API_VERSION` | `1.0` | API version used in generated templates |
| `CONTROLLER_TEMPLATE_RESPONSE_VERSION` | `1.0` | Response version in generated templates |
| `AUTO_GENERATE_CONTROLLER_TEMPLATE` | `true` | Auto-generate controller templates |
| **Endpoints** |
| `HEALTH_CHECK_ENDPOINT` | `/health` | Health check endpoint path |
| `API_DOCS_ENDPOINT` | `/api-docs` | API documentation endpoint path |

## 🚀 Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Custom Configuration
```bash
# With custom environment file
NODE_ENV=production PORT=8080 npm start

# With custom OpenAPI spec
OPENAPI_SPEC_PATH=/path/to/custom-spec.yaml npm start
```

## 📁 Project Structure

```
├── server.js                 # Main application server
├── lib/
│   └── route-generator.js    # OpenAPI route generation logic
├── controllers/
│   └── apiController.js      # Auto-generated controller template
├── open-api-spec.yaml        # OpenAPI specification
├── env.example              # Environment variables template
└── package.json
```

## 🔧 How It Works

1. **Specification Loading**: The application loads your OpenAPI specification file
2. **Route Generation**: Routes are automatically generated based on the paths defined in your OpenAPI spec
3. **Controller Mapping**: Each route is mapped to a controller function based on the `operationId`
4. **Template Generation**: If controller functions don't exist, templates are auto-generated
5. **Middleware Integration**: Each route includes operation metadata for easy access

## 📋 API Endpoints

### Generated Endpoints
All endpoints are generated from your OpenAPI specification. Each endpoint includes:
- Automatic parameter validation setup
- Error handling
- Standardized response format
- Operation metadata

### Built-in Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check with system information |
| `/api-docs` | GET | Raw OpenAPI specification |

The endpoint paths are configurable via environment variables.

## 🎯 Controller Development

### Auto-Generated Templates
Controllers are auto-generated with:
- ✅ Complete function stubs for all operations
- 📝 Detailed parameter documentation
- 🛡️ Error handling boilerplate
- 📊 Standardized response format
- 🔍 Parameter validation comments

### Example Controller Function
```javascript
/**
 * Search jobs with filters
 * Route: POST /api/jobs/search
 * Tags: Jobs
 * @param {object} filters - Search filters (body)
 */
async function searchJobs(req, res) {
  try {
    // Available request data:
    // - req.params: Path parameters (none)
    // - req.body: Request body data
    // - req.query: Query parameters
    // - req.operation: Operation metadata
    
    // TODO: Add request body validation
    
    const response = {
      id: req.operation.operationId,
      ver: "1.0",
      ets: Date.now(),
      params: {
        msgid: require('crypto').randomUUID(),
        err: "",
        status: "SUCCESSFUL",
        errmsg: ""
      },
      responseCode: "OK",
      result: {
        // TODO: Add your response data here
        message: "searchJobs endpoint - implementation needed"
      }
    };

    res.json(response);
  } catch (error) {
    // Error handling is included automatically
  }
}
```

## 🔒 Security Features

- **Helmet**: Security headers automatically applied
- **CORS**: Configurable cross-origin resource sharing
- **Environment-based**: Sensitive configuration via environment variables
- **Error Handling**: Production-safe error messages
- **Input Validation**: Ready-to-implement validation structure

## 📊 Monitoring & Health

### Health Check Response
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "development",
  "api": {
    "version": "1.0",
    "title": "Blue Collar Jobs API"
  }
}
```

### Request Logging
When enabled, all requests are logged with timestamps:
```
[2024-01-01T00:00:00.000Z] POST /api/jobs/search
[2024-01-01T00:00:01.000Z] GET /health
```

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure appropriate `PORT`
3. Set secure paths for `OPENAPI_SPEC_PATH` and `CONTROLLERS_PATH`
4. Disable development features if needed

### Docker Support
The application works well with Docker. Ensure your `Dockerfile` includes:
- Environment variable support
- Proper path handling for OpenAPI spec and controllers
- Volume mounts for configuration files

## 🤝 Development Workflow

1. **Define your API**: Update `open-api-spec.yaml` with your endpoints
2. **Generate templates**: Start the server to auto-generate controller templates
3. **Implement logic**: Fill in the TODO sections in generated controllers
4. **Test endpoints**: Use the built-in API documentation or external tools
5. **Deploy**: Configure environment variables and deploy

## 📈 Performance & Scaling

- **Configurable request limits**: Adjust `REQUEST_BODY_LIMIT` based on needs
- **Efficient route matching**: Express-based routing with path parameter conversion
- **Memory management**: Configurable controller caching and reloading
- **Graceful shutdown**: SIGTERM and SIGINT handling for zero-downtime deployments

## 🔧 Customization

### Custom Controller Structure
Override the default controller file name:
```bash
CONTROLLER_FILE_NAME=myCustomController.js
```

### Custom API Versioning
Set your API version for consistent responses:
```bash
API_VERSION=2.0
CONTROLLER_TEMPLATE_API_VERSION=2.0
```

### Disable Auto-Generation
Prevent automatic template generation:
```bash
AUTO_GENERATE_CONTROLLER_TEMPLATE=false
```

## 📝 License

MIT License - see LICENSE file for details.

---

**🎉 Ready to build your OpenAPI-driven backend with full environment variable support!** 