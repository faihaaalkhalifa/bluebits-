const swaggerJsDoc = require('swagger-jsdoc');
const components = require('./components');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Manager API',
      version: 'v1.0.0',
      description: 'API for managing local events and activities - Event Manager Project',
    },
    servers: [
      {
        url: 'http://localhost:7000/api/v1.0.0',
        description: 'Development server',
      },
    ],
    components: {
      schemas: components,
      parameters: components,
      responses: components,
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      }
    }
  },
  apis: ['./swagger/routes/*.js'] // اقرأ الملفات مباشرة
};

const swaggerSpec = swaggerJsDoc(options);
module.exports = swaggerSpec;