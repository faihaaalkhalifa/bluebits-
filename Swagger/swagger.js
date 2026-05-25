

const swaggerJsDoc = require("swagger-jsdoc");
const components = require("./components");
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Event Manager API",
      version: "v1.0.0",
      description:
        "API for managing local events and activities - Event Manager Project",
    },
     servers: [
      {
        url: "http://localhost:7000/api/v1.0.0",
        description: "Development server",
<<<<<<< HEAD
      },
      {
        url: process.env.API_URL || "https://bluebits24.onrender.com/api/v1.0.0",
        description: "Production server",
      },
    ],
    components: {
       schemas: components,
=======
      },
    ],
    components: {
      schemas: components,
   
>>>>>>> origin/feature/email-verification
      parameters: components,
      responses: components,
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./swagger/routes/*.js"], // اقرأ الملفات مباشرة
};

const swaggerSpec = swaggerJsDoc(options);
module.exports = swaggerSpec;
