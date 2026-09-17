require('dotenv').config();
const nodemailer = require('nodemailer');

function getTransporter() {
  if (!process.env.SMTP_HOST) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true', // true dla portu 465
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Wysyla PDF protokolu na maila.
 */
async function sendProtocolEmail({ to, subject, text, pdfPath }) {
  const transporter = getTransporter();
  if (!transporter) {
    throw new Error('SMTP nie jest skonfigurowane - uzupelnij plik .env (SMTP_HOST, SMTP_USER, SMTP_PASS)');
  }
  if (!to) {
    throw new Error('Brak adresu e-mail odbiorcy');
  }

  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    cc: process.env.SMTP_CC || undefined,
    subject,
    text,
    attachments: [{ filename: 'protokol.pdf', path: pdfPath }],
  });

  return info;
}

module.exports = { sendProtocolEmail, getTransporter };
