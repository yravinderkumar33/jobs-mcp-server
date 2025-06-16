const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

class RouteGenerator {
  constructor(config) {
    // Support both old constructor signature and new config object
    if (typeof config === 'string') {
      // Legacy support: RouteGenerator(specPath, controllersPath)
      this.specPath = config;
      this.controllersPath = arguments[1] || './controllers';
      this.apiVersion = '1.0';
    } else {
      // New config object approach
      this.specPath = config.specPath;
      this.controllersPath = config.controllersPath || './controllers';
      this.apiVersion = config.apiVersion || '1.0';
    }
    
    this.spec = null;
    this.controller = null;
    
    // Configuration from environment variables with defaults
    this.config = {
      controllerFileName: process.env.CONTROLLER_FILE_NAME || 'apiController.js',
      templateApiVersion: process.env.CONTROLLER_TEMPLATE_API_VERSION || this.apiVersion,
      templateResponseVersion: process.env.CONTROLLER_TEMPLATE_RESPONSE_VERSION || '1.0',
      autoGenerateTemplate: process.env.AUTO_GENERATE_CONTROLLER_TEMPLATE !== 'false'
    };
  }

  /**
   * Load and parse the OpenAPI specification
   */
  loadSpec() {
    try {
      const specContent = fs.readFileSync(this.specPath, 'utf8');
      this.spec = yaml.load(specContent);
      console.log(`✅ Loaded OpenAPI spec: ${this.spec.info.title} v${this.spec.info.version}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to load OpenAPI spec:', error.message);
      return false;
    }
  }

  /**
   * Load the single controller module
   */
  loadController() {
    try {
      const controllersDir = path.resolve(this.controllersPath);
      
      if (!fs.existsSync(controllersDir)) {
        console.log(`📁 Creating controllers directory: ${controllersDir}`);
        fs.mkdirSync(controllersDir, { recursive: true });
      }

      const controllerPath = path.join(controllersDir, this.config.controllerFileName);
      
      if (fs.existsSync(controllerPath)) {
        try {
          delete require.cache[require.resolve(controllerPath)];
          this.controller = require(controllerPath);
          console.log(`📦 Loaded controller: ${this.config.controllerFileName}`);
        } catch (error) {
          console.error(`❌ Failed to load controller ${this.config.controllerFileName}:`, error.message);
        }
      } else {
        console.log(`📄 Controller file ${this.config.controllerFileName} not found, will be generated`);
      }
    } catch (error) {
      console.error('❌ Failed to load controller:', error.message);
    }
  }

  /**
   * Convert OpenAPI path to Express path
   * Example: /api/jobs/{job_id} -> /api/jobs/:job_id
   */
  convertPath(openApiPath) {
    return openApiPath.replace(/{([^}]+)}/g, ':$1');
  }

  /**
   * Find controller function by operationId
   */
  findControllerFunction(operationId) {
    if (this.controller && this.controller[operationId]) {
      return this.controller[operationId];
    }
    
    // Return a default handler if controller function is not found
    return (req, res) => {
      res.status(501).json({
        id: operationId,
        ver: this.config.templateApiVersion,
        ets: Date.now(),
        params: {
          msgid: require('crypto').randomUUID(),
          err: 'NOT_IMPLEMENTED',
          status: 'FAILED',
          errmsg: `Controller function '${operationId}' not implemented`
        },
        responseCode: 'NOT_IMPLEMENTED',
        result: {}
      });
    };
  }

  /**
   * Generate Express routes from OpenAPI spec
   * Parameterized routes are generated at the end to avoid route conflicts
   */
  generateRoutes(app) {
    if (!this.spec || !this.spec.paths) {
      console.error('❌ No OpenAPI spec loaded or no paths defined');
      return;
    }

    let routeCount = 0;
    const routesSummary = [];
    const allRoutes = [];

    // First, collect all routes
    for (const [pathTemplate, pathItem] of Object.entries(this.spec.paths)) {
      const expressPath = this.convertPath(pathTemplate);

      for (const [method, operation] of Object.entries(pathItem)) {
        if (!['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method)) {
          continue;
        }

        const operationId = operation.operationId;
        if (!operationId) {
          console.warn(`⚠️  No operationId found for ${method.toUpperCase()} ${pathTemplate}`);
          continue;
        }

        allRoutes.push({
          method,
          pathTemplate,
          expressPath,
          operationId,
          operation,
          isParameterized: expressPath.includes(':')
        });
      }
    }

    // Sort routes: non-parameterized first, then parameterized
    allRoutes.sort((a, b) => {
      // First sort by parameterization (non-parameterized first)
      if (a.isParameterized !== b.isParameterized) {
        return a.isParameterized ? 1 : -1;
      }
      
      // For routes of the same type, sort by path length (more specific first)
      // This helps ensure /api/jobs/search comes before /api/jobs/:id
      if (a.expressPath.length !== b.expressPath.length) {
        return b.expressPath.length - a.expressPath.length;
      }
      
      // Finally, sort alphabetically for consistent ordering
      return a.expressPath.localeCompare(b.expressPath);
    });

    // Now register the sorted routes
    for (const route of allRoutes) {
      const controllerFunction = this.findControllerFunction(route.operationId);
      
      // Create middleware to add operation info to request
      const operationMiddleware = (req, res, next) => {
        req.operation = {
          operationId: route.operationId,
          method: route.method.toUpperCase(),
          path: route.pathTemplate,
          summary: route.operation.summary,
          description: route.operation.description,
          tags: route.operation.tags || []
        };
        next();
      };

      app[route.method](route.expressPath, operationMiddleware, controllerFunction);
      
      const paramMarker = route.isParameterized ? '📌' : '🔗';
      const routeInfo = `${paramMarker} ${route.method.toUpperCase().padEnd(6)} ${route.expressPath.padEnd(30)} -> ${route.operationId}`;
      console.log(routeInfo);
      routesSummary.push({ 
        method: route.method.toUpperCase(), 
        path: route.expressPath, 
        operationId: route.operationId,
        isParameterized: route.isParameterized 
      });
      routeCount++;
    }

    console.log(`\n✅ Generated ${routeCount} routes from OpenAPI spec`);
    console.log(`   📌 Parameterized routes registered last to avoid conflicts\n`);
    return routesSummary;
  }

  /**
   * Generate single controller template file with all operations
   */
  generateControllerTemplate() {
    if (!this.config.autoGenerateTemplate) {
      console.log('🚫 Controller template auto-generation is disabled');
      return;
    }

    if (!this.spec || !this.spec.paths) {
      console.log('⚠️  No OpenAPI spec loaded, skipping controller template generation');
      return;
    }

    const controllerPath = path.join(this.controllersPath, this.config.controllerFileName);

    // Only generate if the file doesn't exist
    if (fs.existsSync(controllerPath)) {
      console.log(`📄 Controller file ${this.config.controllerFileName} already exists, skipping generation`);
      return;
    }

    const operations = this.extractOperationsFromSpec();

    if (operations.length > 0) {
      this.createControllerTemplate(controllerPath, operations);
    } else {
      console.log('⚠️  No operations found in OpenAPI spec');
    }
  }

  /**
   * Extract operations from OpenAPI spec
   */
  extractOperationsFromSpec() {
    const operations = [];

    for (const [pathTemplate, pathItem] of Object.entries(this.spec.paths)) {
      for (const [method, operation] of Object.entries(pathItem)) {
        if (!operation.operationId) continue;

        operations.push({
          operationId: operation.operationId,
          method: method.toUpperCase(),
          path: pathTemplate,
          summary: operation.summary,
          description: operation.description,
          tags: operation.tags || [],
          parameters: operation.parameters || [],
          requestBody: operation.requestBody,
          responses: operation.responses || {}
        });
      }
    }

    return operations;
  }

  /**
   * Create the single controller template file with enhanced template
   */
  createControllerTemplate(filePath, operations) {
    // Ensure the directory exists
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const template = this.generateControllerTemplateContent(operations);
    
    fs.writeFileSync(filePath, template);
    console.log(`📄 Generated controller template: ${filePath}`);
    console.log(`📝 Contains ${operations.length} operation functions`);
    console.log(`🔧 Template configuration:`);
    console.log(`   - API Version: ${this.config.templateApiVersion}`);
    console.log(`   - Response Version: ${this.config.templateResponseVersion}`);
    console.log(`   - Auto-generate: ${this.config.autoGenerateTemplate}`);
  }

  /**
   * Generate the controller template content
   */
  generateControllerTemplateContent(operations) {
    const headerComment = `/**
 * API Controller
 * Auto-generated controller template with all operations
 * Generated from OpenAPI specification: ${this.spec.info.title} v${this.spec.info.version}
 * Template API Version: ${this.config.templateApiVersion}
 * Generated on: ${new Date().toISOString()}
 */`;

    const operationFunctions = operations.map(op => this.generateOperationFunction(op)).join('\n');

    const moduleExports = `
module.exports = {
${operations.map(op => `  ${op.operationId}`).join(',\n')}
};`;

    return `${headerComment}\n\n${operationFunctions}${moduleExports}
`;
  }

  /**
   * Generate individual operation function
   */
  generateOperationFunction(operation) {
    const parameterComments = this.generateParameterComments(operation);
    const responseExamples = this.generateResponseExamples(operation);

    return `
/**
 * ${operation.summary || operation.operationId}
 * ${operation.description || ''}
 * Route: ${operation.method} ${operation.path}
 * Tags: ${operation.tags.join(', ')}
 ${parameterComments}
 */
async function ${operation.operationId}(req, res) {
  try {
    // TODO: Implement ${operation.operationId} logic here
    
    // Available request data:
    // - req.params: Path parameters ${this.getPathParams(operation.path)}
    // - req.body: Request body data
    // - req.query: Query parameters
    // - req.operation: Operation metadata
    
    ${this.generateValidationComments(operation)}

    // Sample successful response
    const response = {
      id: req.operation.operationId,
      ver: "${this.config.templateResponseVersion}",
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
        message: "${operation.operationId} endpoint - implementation needed"
        ${responseExamples}
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error in ${operation.operationId}:', error);
    res.status(500).json({
      id: req.operation.operationId,
      ver: "${this.config.templateResponseVersion}",
      ets: Date.now(),
      params: {
        msgid: require('crypto').randomUUID(),
        err: "INTERNAL_ERROR",
        status: "FAILED",
        errmsg: error.message
      },
      responseCode: "INTERNAL_ERROR",
      result: {}
    });
  }
}`;
  }

  /**
   * Generate parameter comments for the operation
   */
  generateParameterComments(operation) {
    if (!operation.parameters || operation.parameters.length === 0) {
      return '';
    }

    const paramComments = operation.parameters.map(param => {
      return ` * @param {${param.schema?.type || 'any'}} ${param.name} - ${param.description || 'No description'} (${param.in})`;
    }).join('\n');

    return `*\n${paramComments}`;
  }

  /**
   * Generate validation comments
   */
  generateValidationComments(operation) {
    const comments = [];
    
    if (operation.parameters && operation.parameters.length > 0) {
      comments.push('// TODO: Add parameter validation');
      operation.parameters.forEach(param => {
        if (param.required) {
          comments.push(`//   - Validate required ${param.in} parameter: ${param.name}`);
        }
      });
    }

    if (operation.requestBody) {
      comments.push('// TODO: Add request body validation');
    }

    return comments.length > 0 ? comments.join('\n    ') + '\n' : '';
  }

  /**
   * Get path parameters from path template
   */
  getPathParams(path) {
    const matches = path.match(/{([^}]+)}/g);
    return matches ? `(${matches.map(m => m.slice(1, -1)).join(', ')})` : '(none)';
  }

  /**
   * Generate response examples based on OpenAPI responses
   */
  generateResponseExamples(operation) {
    if (!operation.responses || Object.keys(operation.responses).length === 0) {
      return '';
    }

    const successResponse = operation.responses['200'] || operation.responses['201'];
    if (successResponse && successResponse.content) {
      return ',\n        // TODO: Structure response based on OpenAPI spec';
    }

    return '';
  }
}

module.exports = RouteGenerator; 