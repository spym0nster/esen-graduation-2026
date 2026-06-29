import nodemailer from "nodemailer";

// Startup validation
const requiredEnvVars = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "SMTP_FROM_NAME",
  "SMTP_FROM_EMAIL",
];

const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

if (missingVars.length > 0) {
  console.warn(
    `[EMAIL SERVICE WARNING] Missing SMTP environment variables: ${missingVars.join(
      ", "
    )}. Emails will fail to send.`
  );
}

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: { filename: string; content: string | Buffer; cid?: string; encoding?: string }[];
}) {
  const fromName = process.env.SMTP_FROM_NAME || "ESEN Graduation Ceremony 2026";
  const fromEmail = process.env.SMTP_FROM_EMAIL || "ceremonie.graduation@esen.tn";

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    subject,
    html,
    attachments,
  };

  return transporter.sendMail(mailOptions);
}
