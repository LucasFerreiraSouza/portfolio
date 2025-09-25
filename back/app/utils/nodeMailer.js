const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const nodemailer = require('nodemailer');

// Credenciais do Brevo
const EMAIL_USER = process.env.EMAIL_USER;   // login técnico (ex: 94e1b4001@smtp-brevo.com)
const EMAIL_PASS = process.env.EMAIL_PASS;   // senha SMTP
const EMAIL_FROM = process.env.EMAIL_FROM;   // remetente verificado no Brevo

if (!EMAIL_USER || !EMAIL_PASS || !EMAIL_FROM) {
  console.error('Credenciais do Brevo ausentes. Verifique seu .env');
  process.exit(1);
}

// Configura o transporter do Nodemailer para Brevo SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // STARTTLS
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// Exporta o transporter para ser usado nos controllers
module.exports = { transporter };

// --- Opcional: teste de envio ---
// (function test() {
//   transporter.sendMail({
//     from: `"Cyber Chase" <${EMAIL_FROM}>`,
//     to: 'teste@yopmail.com',
//     subject: 'Teste Nodemailer Brevo',
//     text: 'Teste de envio',
//   }).then(info => console.log('Email enviado:', info.messageId))
//     .catch(err => console.error('Erro ao enviar email:', err));
// })();
