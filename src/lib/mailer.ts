import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.NODE_ENV === "production",
  auth:
    process.env.NODE_ENV === "production"
      ? {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASS!,
        }
      : undefined,
} as SMTPTransport.Options);

export class Mailer {
  constructor(private readonly transporter: nodemailer.Transporter) {}

  async sendEmail(to: string, subject: string, text: string) {
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM!,
        to,
        subject,
        text,
      });
      return { success: true, message: "Email sent successfully" };
    } catch {
      throw new Error("Failed to send email");
    }
  }
}
