const {
  ActivityStatus,
  CategoryType,
  AttendanceStatus,
  RoleCode,
} = require("../utils/enum");

// ============ SCHEMAS ============

exports.User = {
  type: "object",
  properties: {
    _id: { type: "string", example: "507f1f77bcf86cd799439011" },
    name: { type: "string", example: "Faihaa al-khalifa" },
    email: { type: "string", format: "email", example: "umalfof@gmail.com" },
    role: { type: "string", enum: Object.values(RoleCode), example: "BLUE" },
    profile_image: { type: "string", example: "default.jpg" },
    active: { type: "boolean", example: true },
      year: { type: "string", example: "5th" },
  isBanned: { type: "boolean", example: false },
   number: { type: "string", example: "6144" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

exports.createUser = {
  type: "object",
  required: ["name", "email", "password"],
  properties: {
    name: { type: "string", example: "Ahmed Mohamed" },
    email: { type: "string", format: "email", example: "ahmed@example.com" },
    password: { type: "string", format: "password", example: "12345678" },
    role: { type: "string", enum: Object.values(RoleCode), example: "USER" },
    profile_image: { type: "string", example: "default.jpg" },
  },
};

exports.updateUser = {
  type: "object",
  properties: {
    name: { type: "string", example: "Ahmed Mohamed" },
    email: { type: "string", format: "email", example: "ahmed@example.com" },
    profile_image: { type: "string", example: "updated.jpg" },
  },
};

// ============ RESPONSES ============

exports.Error = {
  type: "object",
  properties: {
    status: { type: "string", example: "error" },
    message: { type: "string", example: "An error occurred" },
  },
};

exports.DuplicateEmail = {
  description: "Email already exists",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
      example: { status: "error", message: "Email already exists" },
    },
  },
};

exports.Unauthorized = {
  description: "Unauthorized",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
      example: {
        status: "error",
        message: "You are not logged in! Please log in to get access.",
      },
    },
  },
};

exports.Forbidden = {
  description: "Forbidden",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
      example: {
        status: "error",
        message: "You do not have permission to perform this action",
      },
    },
  },
};

exports.NotFound = {
  description: "Not found",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
      example: {
        status: "error",
        message: "Activity not found",
      },
    },
  },
};

// ============ PARAMETERS ============

exports.IdParameter = {
  name: "id",
  in: "path",
  required: true,
  schema: {
    type: "string",
  },
  description: "Item ID",
};

exports.PageParameter = {
  name: "page",
  in: "query",
  required: false,
  schema: {
    type: "integer",
    default: 1,
    minimum: 1,
  },
  description: "Page number",
};

exports.LimitParameter = {
  name: "limit",
  in: "query",
  required: false,
  schema: {
    type: "integer",
    default: 10,
    minimum: 1,
    maximum: 100,
  },
  description: "Items per page",
};

// ============ AUTH RESPONSES ============

exports.LoginSuccess = {
  description: "Login successful",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          status: { type: "string", example: "success" },
          data: {
            type: "object",
            properties: {
              token: {
                type: "string",
                example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
              },
              user: { $ref: "#/components/schemas/User" },
            },
          },
        },
      },
    },
  },
};

exports.LogoutSuccess = {
  description: "Logout successful",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          status: { type: "string", example: "success" },
          data: { type: "object", example: null },
        },
      },
    },
  },
};

exports.PasswordResetSent = {
  description: "Password reset token sent",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          status: { type: "string", example: "success" },
          message: {
            type: "string",
            example: "Password reset token sent to email successfully.",
          },
          data: { type: "object", example: null },
        },
      },
    },
  },
};

exports.InvalidCredentials = {
  description: "Invalid email or password",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
      example: {
        status: "error",
        message: "Incorrect email or password",
      },
    },
  },
};

exports.MissingCredentials = {
  description: "Email and password required",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
      example: {
        status: "error",
        message: "Please provide email and password!",
      },
    },
  },
};

exports.InvalidToken = {
  description: "Invalid or expired token",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
      example: {
        status: "error",
        message: "Token is invalid or has expired",
      },
    },
  },
};

exports.UserNotFound = {
  description: "User not found",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
      example: {
        status: "error",
        message: "There is no user with that email address.",
      },
    },
  },
};

exports.InvalidCurrentPassword = {
  description: "Current password is incorrect",
  content: {
    "application/json": {
      schema: { $ref: "#/components/schemas/Error" },
      example: {
        status: "error",
        message: "Your current password is wrong.",
      },
    },
  },
};
// ============ SUBJECT SCHEMAS ============

exports.Subject = {
  type: "object",
  properties: {
    _id: { type: "string", example: "6a12078e8719e7571f0662d6" },
    name: { type: "string", example: "إدارة شبكات" },
    description: { type: "string", example: "مادة تابعة لقسم الشبكات" },
    difficultyDefault: { type: "number", example: 3 },
    studyDaysDefault: { type: "number", example: 7 },
    examDuration: { type: "number", example: 120 },
    createdBy: {
      type: "object",
      properties: {
        _id: { type: "string", example: "69ee50bff8208eb66bcc3cc0" },
        name: { type: "string", example: "faihaa" },
        email: { type: "string", example: "faihaa@gmail.com" },
      },
    },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

exports.createSubject = {
  type: "object",
  required: ["name"],
  properties: {
    name: { type: "string", example: "إدارة شبكات" },
    description: { type: "string", example: "مادة تابعة لقسم الشبكات" },
    difficultyDefault: { type: "number", example: 3 },
    studyDaysDefault: { type: "number", example: 7 },
    examDuration: { type: "number", example: 120 },
  },
};

exports.updateSubject = {
  type: "object",
  properties: {
    name: { type: "string", example: "إدارة شبكات" },
    description: { type: "string", example: "وصف محدث" },
    difficultyDefault: { type: "number", example: 4 },
    studyDaysDefault: { type: "number", example: 10 },
    examDuration: { type: "number", example: 90 },
  },
};
// ============ LECTURE SCHEMAS ============

exports.Lecture = {
  type: "object",
  properties: {
    _id: { type: "string", example: "6a0b7b0b545a9571b9673a72" },
    title: { type: "string", example: "محاضرة الأولى" },
    description: { type: "string", example: "شرح مفصل للمحاضرة الأولى" },
    uploadedBy: {
      type: "object",
      properties: {
        _id: { type: "string", example: "69ee50bff8208eb66bcc3cc0" },
        name: { type: "string", example: "faihaa" },
        email: { type: "string", example: "faihaa@gmail.com" },
      },
    },
    subjectId: {
      type: "object",
      properties: {
        _id: { type: "string", example: "6a12078e8719e7571f0662d6" },
        name: { type: "string", example: "إدارة شبكات" },
      },
    },
    isPublished: { type: "boolean", example: true },
    fileUrl: { type: "string", example: "https://res.cloudinary.com/..." },
    fileSize: { type: "number", example: 2381458 },
    fileType: { type: "string", example: "image/png" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

exports.createLecture = {
  type: "object",
  required: ["title", "subjectId"],
  properties: {
    title: { type: "string", example: "محاضرة الأولى" },
    description: { type: "string", example: "شرح مفصل للمحاضرة الأولى" },
    subjectId: { type: "string", example: "6a12078e8719e7571f0662d6" },
    isPublished: { type: "boolean", example: false },
    lecture: { type: "string", format: "binary" },
  },
};

exports.updateLecture = {
  type: "object",
  properties: {
    title: { type: "string", example: "محاضرة معدلة" },
    description: { type: "string", example: "وصف محدث" },
    isPublished: { type: "boolean", example: true },
    lecture: { type: "string", format: "binary" },
  },
};

// ============ YEAR SCHEMAS ============

exports.Year = {
  type: "object",
  properties: {
    _id: { type: "string", example: "6a12078e8719e7571f0662d6" },
    name: { type: "string", example: "Year 1" },
    order: { type: "number", example: 1 },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

exports.createYear = {
  type: "object",
  required: ["name", "order"],
  properties: {
    name: { type: "string", example: "Year 1" },
    order: { type: "number", example: 1 },
  },
};

exports.updateYear = {
  type: "object",
  properties: {
    name: { type: "string", example: "Year 2" },
    order: { type: "number", example: 2 },
  },
};

// ============ SEMESTER SCHEMAS ============

exports.Semester = {
  type: "object",
  properties: {
    _id: { type: "string", example: "6a12078e8719e7571f0662d7" },
    name: { type: "string", example: "Semester 1" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

exports.createSemester = {
  type: "object",
  required: ["name"],
  properties: {
    name: { type: "string", example: "Semester 1" },
  },
};

exports.updateSemester = {
  type: "object",
  properties: {
    name: { type: "string", example: "Semester 2" },
  },
};

// ============ COMMENT SCHEMAS ============

exports.Comment = {
  type: "object",
  properties: {
    _id: { type: "string", example: "6a2abc1234567890abcdef12" },
    content: { type: "string", example: "محاضرة ممتازة شكراً دكتور" },
    userId: {
      type: "object",
      properties: {
        _id: { type: "string", example: "69ee50bff8208eb66bcc3cc0" },
        name: { type: "string", example: "faihaa" },
        profile_image: { type: "string", example: "default.jpg" },
      },
    },
    lectureId: { type: "string", example: "6a25ce948638636fd12b85b3d9d" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

exports.createComment = {
  type: "object",
  required: ["content"],
  properties: {
    content: { type: "string", example: "محاضرة ممتازة شكراً دكتور" },
  },
};

exports.updateComment = {
  type: "object",
  required: ["content"],
  properties: {
    content: { type: "string", example: "تعليق معدل" },
  },
};


// ============ REACTION SCHEMAS ============

exports.Reaction = {
  type: "object",
  properties: {
    _id: { type: "string", example: "6a2abc1234567890abcdef34" },
    userId: { type: "string", example: "69ee50bff8208eb66bcc3cc0" },
    lectureId: { type: "string", example: "6a25ce948638636fd12b85b3d9d" },
    type: { type: "string", enum: ["like", "dislike"], example: "like" },
    createdAt: { type: "string", format: "date-time" },
    updatedAt: { type: "string", format: "date-time" },
  },
};

exports.createReaction = {
  type: "object",
  required: ["type"],
  properties: {
    type: { type: "string", enum: ["like", "dislike"], example: "like" },
  },
};

exports.LectureReactionsSummary = {
  type: "object",
  properties: {
    likes: { type: "integer", example: 5 },
    dislikes: { type: "integer", example: 1 },
    userReaction: {
      type: "string",
      enum: ["like", "dislike", null],
      example: "like",
    },
  },
};