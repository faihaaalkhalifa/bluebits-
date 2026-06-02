// config/email.js
class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `BlueBits <verify@${process.env.EMAIL_DOMAIN}>`;
  }

  // إرسال الإيميل عبر Resend API
  async sendResendEmail(subject, htmlContent) {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (!RESEND_API_KEY) {
      console.error("❌ RESEND_API_KEY is not defined");
      throw new Error("Resend API key missing");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: this.from,
        to: [this.to],
        subject: subject,
        html: htmlContent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("❌ Resend API error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    const data = await response.json();
    console.log(`✅ Email sent to ${this.to} via Resend. ID: ${data.id}`);
  }

  async sendVerification() {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { 
            background-color: #007bff; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px; 
            display: inline-block;
            margin: 20px 0;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>أهلاً ${this.firstName}! 👋</h2>
          <p>شكراً لتسجيلك في منصة <strong>BLUE BITS</strong></p>
          <p>الرجاء الضغط على الرابط أدناه لتفعيل حسابك (الرابط صالح لمدة 24 ساعة):</p>
          <a href="${this.url}" class="button">تفعيل الحساب</a>
          <p>أو انسخ هذا الرابط:</p>
          <p><a href="${this.url}">${this.url}</a></p>
          <hr>
          <div class="footer">
            <p>إذا لم تقم بإنشاء حساب، يرجى تجاهل هذا البريد.</p>
            <p>© 2026 BLUE BITS - جميع الحقوق محفوظة</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await this.sendResendEmail("🔐 BLUE BITS - تفعيل حسابك", htmlContent);
  }

  async sendPasswordReset() {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .button { 
            background-color: #28a745; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 5px; 
            display: inline-block;
            margin: 20px 0;
          }
          .footer { margin-top: 30px; font-size: 12px; color: #777; }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>مرحباً ${this.firstName}! 🔐</h2>
          <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك في <strong>BLUE BITS</strong></p>
          <p>الرجاء الضغط على الرابط أدناه لإعادة تعيين كلمة المرور (الرابط صالح لمدة 10 دقائق):</p>
          <a href="${this.url}" class="button">إعادة تعيين كلمة المرور</a>
          <p>أو انسخ هذا الرابط:</p>
          <p><a href="${this.url}">${this.url}</a></p>
          <hr>
          <div class="footer">
            <p>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد.</p>
            <p>© 2026 BLUE BITS - جميع الحقوق محفوظة</p>
          </div>
        </div>
      </body>
      </html>
    `;
    
    await this.sendResendEmail("🔑 BLUE BITS - استعادة كلمة المرور", htmlContent);
  }
}

module.exports = Email;