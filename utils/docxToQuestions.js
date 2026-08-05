const mammoth = require('mammoth');

/**
 * الصيغة المتوقعة داخل ملف الوورد (كل سؤال فقرة مستقلة):
 *
 * 1. نص السؤال هون؟
 * A) خيار أول
 * B) خيار ثاني *
 * C) خيار ثالث
 * D) خيار رابع
 * تفسير: سبب الإجابة (اختياري)
 *
 * 2. عبارة صح/خطأ هون
 * A) صح *
 * B) خطأ
 *
 * - رقم السؤال ثم نقطة أو قوس: "1." أو "1)"
 * - الخيارات تبدأ بحرف (A-D أو أ-د) ثم نقطة أو قوس
 * - النجمة (*) بآخر سطر الخيار الصحيح تحدد الإجابة الصحيحة (خيار واحد فقط لكل سؤال)
 * - سؤال صح/خطأ: خيارين بالضبط ونصهما "صح" و"خطأ"
 */

const QUESTION_REGEX = /^\s*\d+[.)]\s*(.+)$/;
const OPTION_REGEX = /^\s*[A-Da-dأابجد][.)]\s*(.+?)\s*(\*)?\s*$/;
const EXPLANATION_REGEX = /^\s*(تفسير|الشرح)\s*[:：]\s*(.+)$/;

function finalizeQuestion(q) {
  const isTrueFalse =
    q.options.length === 2 &&
    q.options.some((o) => /^(صح|صحيح)$/.test(o.text.trim())) &&
    q.options.some((o) => /^خطأ$/.test(o.text.trim()));

  return {
    type: isTrueFalse ? 'true_false' : 'mcq',
    questionText: q.questionText,
    options: q.options,
    explanation: q.explanation,
  };
}

async function docxBufferToQuestions(buffer) {
  const { value: rawText } = await mammoth.extractRawText({ buffer });
  const lines = rawText
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const questions = [];
  let current = null;

  for (const line of lines) {
    const oMatch = line.match(OPTION_REGEX);
    const qMatch = !oMatch ? line.match(QUESTION_REGEX) : null;
    const eMatch = line.match(EXPLANATION_REGEX);

    if (qMatch) {
      if (current) questions.push(finalizeQuestion(current));
      current = { questionText: qMatch[1].trim(), options: [] };
      continue;
    }

    if (oMatch && current) {
      current.options.push({
        text: oMatch[1].trim(),
        isCorrect: !!oMatch[2],
      });
      continue;
    }

    if (eMatch && current) {
      current.explanation = eMatch[2].trim();
    }
  }
  if (current) questions.push(finalizeQuestion(current));

  return questions;
}

module.exports = { docxBufferToQuestions };