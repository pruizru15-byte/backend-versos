import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, message: string, from: string, name: string) => {
  const mailOptions = {
    from: `"${name}" <${process.env.SMTP_USER}>`, // Gmail requires from to be the authenticated user
    to,
    replyTo: from,
    subject,
    html: `
      <div style="font-family: serif; padding: 20px; border: 1px solid #c9a227; border-radius: 10px; max-width: 600px;">
        <h2 style="color: #c9a227; border-bottom: 1px solid #eee; padding-bottom: 10px;">Nuevo mensaje de Versos</h2>
        <p><strong>De:</strong> ${name} &lt;${from}&gt;</p>
        <p><strong>Asunto:</strong> ${subject}</p>
        <div style="background: #fdfaf0; padding: 15px; border-radius: 5px; margin-top: 15px; line-height: 1.6; color: #333;">
          ${message.replace(/\n/g, '<br/>')}
        </div>
        <p style="margin-top: 20px; font-size: 12px; color: #888;">Este es un mensaje automático del sistema imperial de Versos.</p>
      </div>
    `,
  };

  return transporter.sendMail(mailOptions);
};
