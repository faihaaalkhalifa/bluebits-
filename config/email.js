const nodemailer = require("nodemailer");

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = process.env.EMAIL_FROM;
  }

  newTransport() {
    // استخدام Gmail للإرسال الحقيقي
    return nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async send(subject) {
    try {
      // 2) define email options
      const mailOptions = {
        from: this.from,
        to: this.to,
        subject,
        text: this.url, // إرسال الرابط كنص عادي فقط
      };

      // 3) create transport and send email
      const transporter = this.newTransport();
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("Failed to send email");
    }
  }

  async sendPasswordReset() {
    await this.send("BLUE BITS - Password Reset");
  }

  async sendVerificationEmail() {
    await this.send("BLUE BITS - Email Verification (Valid for 24h)");
  }

  async sendVerification() {
    try {
      const mailOptions = {
        from: this.from,
        to: this.to,
        subject: "BLUE BITS - Email Verification",
        html: `
          <h2>أهلا ${this.firstName}! 👋</h2>
          <p>شكراً لتسجيلك في منصة BLUE BITS</p>
          <p>الرجاء الضغط على الرابط أدناه لتفعيل حسابك (الرابط صالح لمدة 24 ساعة):</p>
          <a href="${this.url}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
            تفعيل الحساب
          </a>
          <p>أو انسخ هذا الرابط:</p>
          <p>${this.url}</p>
          <hr>
          <p>إذا لم تقم بإنشاء حساب، تجاهل هذا البريد.</p>
        `,
      };

      const transporter = this.newTransport();
      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error("Error sending verification email:", error);
      throw new Error("Failed to send verification email");
    }
  }
};
