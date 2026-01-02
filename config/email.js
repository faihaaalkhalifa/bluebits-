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
};
