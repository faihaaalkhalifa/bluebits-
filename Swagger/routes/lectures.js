/**
 * @swagger
 * tags:
 *   name: Lectures
 *   description: Lecture management - upload, download, update, delete
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Lecture:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "6a0b7a7e545a9571b9673a6f"
 *         title:
 *           type: string
 *           example: "Text"
 *         description:
 *           type: string
 *           example: "Description"
 *         uploadedBy:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             email:
 *               type: string
 *         isPublished:
 *           type: boolean
 *           example: true
 *         fileUrl:
 *           type: string
 *         fileSize:
 *           type: number
 *         fileType:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /lectures:
 *   get:
 *     summary: GET getAll
 *     description: Get all lectures
 *     tags: [Lectures]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *
 *   post:
 *     summary: POST upload
 *     description: Upload a new lecture
 *     tags: [Lectures]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - lecture
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Text"
 *               description:
 *                 type: string
 *                 example: "Description"
 *               isPublished:
 *                 type: string
 *                 example: "true"
 *               lecture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Created
 */

/**
 * @swagger
 * /lectures/{id}:
 *   get:
 *     summary: GET getOne
 *     description: Get a specific lecture by ID
 *     tags: [Lectures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "6a0b7a7e545a9571b9673a6f"
 *     responses:
 *       200:
 *         description: Success
 *
 *   patch:
 *     summary: PATCH update
 *     description: Update a lecture
 *     tags: [Lectures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "6a0b7a7e545a9571b9673a6f"
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Text"
 *               description:
 *                 type: string
 *                 example: "Description"
 *               isPublished:
 *                 type: string
 *                 example: "true"
 *               lecture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Updated
 *
 *   delete:
 *     summary: DEL delete
 *     description: Delete a lecture
 *     tags: [Lectures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "6a0b7a7e545a9571b9673a6f"
 *     responses:
 *       200:
 *         description: Deleted
 */

/**
 * @swagger
 * /lectures/{id}/download:
 *   get:
 *     summary: GET download
 *     description: Download lecture file
 *     tags: [Lectures]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         example: "6a0b7a7e545a9571b9673a6f"
 *     responses:
 *       200:
 *         description: File downloaded
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 */