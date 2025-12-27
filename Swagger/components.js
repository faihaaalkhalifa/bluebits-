const { ActivityStatus, CategoryType, AttendanceStatus, RoleCode } = require('../utils/enum');

// ============ SCHEMAS ============

exports.User = {
  type: 'object',
  properties: {
    _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
    name: { type: 'string', example: 'Ahmed Mohamed' },
    email: { type: 'string', format: 'email', example: 'ahmed@example.com' },
    role: { type: 'string', enum: Object.values(RoleCode), example: 'USER' },
    profile_image: { type: 'string', example: 'default.jpg' },
    active: { type: 'boolean', example: true },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' }
  }
};

exports.createUser = {
  type: 'object',
  required: ['name', 'email', 'password'],
  properties: {
    name: { type: 'string', example: 'Ahmed Mohamed' },
    email: { type: 'string', format: 'email', example: 'ahmed@example.com' },
    password: { type: 'string', format: 'password', example: '12345678' },
    role: { type: 'string', enum: Object.values(RoleCode), example: 'USER' },
    profile_image: { type: 'string', example: 'default.jpg' }
  }
};

exports.updateUser = {
  type: 'object',
  properties: {
    name: { type: 'string', example: 'Ahmed Mohamed' },
    email: { type: 'string', format: 'email', example: 'ahmed@example.com' },
    profile_image: { type: 'string', example: 'updated.jpg' }
  }
};




// ============ RESPONSES ============

exports.Error = {
  type: 'object',
  properties: { 
    status: { type: 'string', example: 'error' }, 
    message: { type: 'string', example: 'An error occurred' } 
  }
};

exports.DuplicateEmail = {
  description: 'Email already exists',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
      example: { status: 'error', message: 'Email already exists' }
    }
  }
};

exports.Unauthorized = {
  description: 'Unauthorized',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
      example: {
        status: 'error',
        message: 'You are not logged in! Please log in to get access.'
      }
    }
  }
};

exports.Forbidden = {
  description: 'Forbidden',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
      example: {
        status: 'error',
        message: 'You do not have permission to perform this action'
      }
    }
  }
};

exports.NotFound = {
  description: 'Not found',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
      example: {
        status: 'error',
        message: 'Activity not found'
      }
    }
  }
};

// ============ PARAMETERS ============

exports.IdParameter = {
  name: 'id',
  in: 'path',
  required: true,
  schema: {
    type: 'string'
  },
  description: 'Item ID'
};

exports.PageParameter = {
  name: 'page',
  in: 'query',
  required: false,
  schema: {
    type: 'integer',
    default: 1,
    minimum: 1
  },
  description: 'Page number'
};

exports.LimitParameter = {
  name: 'limit',
  in: 'query',
  required: false,
  schema: {
    type: 'integer',
    default: 10,
    minimum: 1,
    maximum: 100
  },
  description: 'Items per page'
};




// ============ AUTH RESPONSES ============

exports.LoginSuccess = {
  description: 'Login successful',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          data: {
            type: 'object',
            properties: {
              token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
              user: { $ref: '#/components/schemas/User' }
            }
          }
        }
      }
    }
  }
};

exports.LogoutSuccess = {
  description: 'Logout successful',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          data: { type: 'object', example: null }
        }
      }
    }
  }
};

exports.PasswordResetSent = {
  description: 'Password reset token sent',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'success' },
          message: { 
            type: 'string', 
            example: 'Password reset token sent to email successfully.' 
          },
          data: { type: 'object', example: null }
        }
      }
    }
  }
};

exports.InvalidCredentials = {
  description: 'Invalid email or password',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
      example: {
        status: 'error',
        message: 'Incorrect email or password'
      }
    }
  }
};

exports.MissingCredentials = {
  description: 'Email and password required',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
      example: {
        status: 'error',
        message: 'Please provide email and password!'
      }
    }
  }
};

exports.InvalidToken = {
  description: 'Invalid or expired token',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
      example: {
        status: 'error',
        message: 'Token is invalid or has expired'
      }
    }
  }
};

exports.UserNotFound = {
  description: 'User not found',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
      example: {
        status: 'error',
        message: 'There is no user with that email address.'
      }
    }
  }
};

exports.InvalidCurrentPassword = {
  description: 'Current password is incorrect',
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
      example: {
        status: 'error',
        message: 'Your current password is wrong.'
      }
    }
  }
};