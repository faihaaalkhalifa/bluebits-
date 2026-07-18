const cron = require('node-cron');
const AcademicTask = require('../models/academicTaskModel');

exports.startTaskAutoClose = () => {
  // بيشتغل كل دقيقة
  cron.schedule('* * * * *', async () => {
    try {
      const result = await AcademicTask.updateMany(
        { status: 'open', closesAt: { $lte: new Date() } },
        { $set: { status: 'closed' } }
      );
      if (result.modifiedCount > 0) {
        console.log(`🔒 تم إغلاق ${result.modifiedCount} تاسك تلقائياً`);
      }
    } catch (err) {
      console.error('❌ خطأ بإغلاق التاسكات التلقائي:', err.message);
    }
  });
};