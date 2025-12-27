// utils/responseHandler.js

/**
 * دالة لإرسال استجابة نجاح موحدة
 * @param {object} res - كائن الاستجابة من Express
 * @param {number} statusCode - رمز حالة HTTP (عادة 200)
 * @param {string} message - رسالة النجاح
 * @param {any} data - البيانات الفعلية التي تم طلبها
 */
exports.successResponse = (res, statusCode, message, data) => {
  return res.status(statusCode).json({
    isSuccess: true, // ثابت: نجاح
    message: message,
    statusCode: statusCode,
    data: data, // البيانات المطلوبة هنا
  });
};

/**
 * دالة لإرسال استجابة خطأ موحدة
 * @param {object} res - كائن الاستجابة من Express
 * @param {number} statusCode - رمز حالة HTTP (مثل 400، 404، 500)
 * @param {string} message - رسالة الخطأ
 */
exports.errorResponse = (res, statusCode, message) => {
  return res.status(statusCode).json({
    isSuccess: false, // ثابت: فشل
    message: message,
    statusCode: statusCode,
    data: null, // في حالة الخطأ، لا يوجد بيانات (أو كائن فارغ {})
  });
};
