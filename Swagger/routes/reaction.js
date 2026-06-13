/**
 * @swagger
 * tags:
 *   name: Reactions
 *   description: Lecture likes and dislikes management
 */

/**
 * @swagger
 * /reactions/lecture/{lectureId}:
 *   get:
 *     summary: Get reactions summary for a lecture
 *     description: Returns total likes, dislikes, and the current user's reaction
 *     tags: [Reactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: lectureId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Lecture ID
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isSuccess:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: success
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   $ref: '#/components/schemas/LectureReactionsSummary'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   post:
 *     summary: Add, change, or remove a reaction (toggle)
 *     description: |
 *       - If no reaction exists, creates a new one.
 *       - If the same type is sent again, the reaction is removed.
 *       - If a different type is sent, the reaction is updated.
 *     tags: [Reactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: lectureId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Lecture ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/createReaction'
 *     responses:
 *       "200":
 *         description: Reaction toggled or updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isSuccess:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: تم تغيير التفاعل
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   oneOf:
 *                     - $ref: '#/components/schemas/Reaction'
 *                     - type: object
 *                       example: null
 *       "201":
 *         description: Reaction created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isSuccess:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: تم إضافة التفاعل بنجاح
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 data:
 *                   $ref: '#/components/schemas/Reaction'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */