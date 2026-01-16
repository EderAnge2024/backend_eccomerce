// Servicio de email centralizado

import nodemailer from "nodemailer";
import { ENV_CONFIG } from "../../config/env.js";

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    if (!ENV_CONFIG.EMAIL.GMAIL_USER || !ENV_CONFIG.EMAIL.GMAIL_APP_PASSWORD) {
      console.warn('⚠️  Email credentials not configured. Email features will be disabled.');
      return;
    }

    this.transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: ENV_CONFIG.EMAIL.GMAIL_USER,
        pass: ENV_CONFIG.EMAIL.GMAIL_APP_PASSWORD
      },
      connectionTimeout: 30000,
      socketTimeout: 30000,
      greetingTimeout: 30000,
      pool: true,
      maxConnections: 3,
      maxMessages: 50
    });
  }

  async sendEmailWithRetry(mailOptions, maxRetries = 3) {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`📧 Intento ${attempt} de enviar correo a: ${mailOptions.to}`);
        const result = await this.transporter.sendMail(mailOptions);
        console.log(`✅ Correo enviado a: ${mailOptions.to}`);
        return { success: true, messageId: result.messageId };
      } catch (error) {
        console.error(`❌ Intento ${attempt} fallido:`, error.code);
        if (attempt === maxRetries) throw error;
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  async sendVerificationCode(correo, codigo) {
    const mailOptions = {
      from: `"Sistema de Verificación" <${ENV_CONFIG.EMAIL.GMAIL_USER}>`,
      to: correo,
      subject: '🔐 Código de Verificación - Recuperación de Contraseña',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; text-align: center;">Recuperación de Contraseña</h2>
          <p>Hola,</p>
          <p>Has solicitado restablecer tu contraseña. Usa el siguiente código para verificar tu identidad:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; margin: 25px 0; letter-spacing: 8px; border-radius: 8px;">
            ${codigo}
          </div>
          <p>Este código expirará en <strong>10 minutos</strong>.</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Si no solicitaste este código, por favor ignora este mensaje.
          </p>
        </div>
      `
    };

    try {
      return await this.sendEmailWithRetry(mailOptions);
    } catch (error) {
      console.error('❌ Error enviando correo:', error);
      throw new Error(`Error al enviar el correo: ${error.message}`);
    }
  }

  async sendWelcomeEmail(correo, nombre) {
    const mailOptions = {
      from: `"Bienvenido" <${ENV_CONFIG.EMAIL.GMAIL_USER}>`,
      to: correo,
      subject: '🎉 ¡Bienvenido a nuestra plataforma!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50; text-align: center;">¡Bienvenido ${nombre}!</h2>
          <p>Gracias por registrarte en nuestra plataforma de ecommerce.</p>
          <p>Ya puedes comenzar a explorar nuestros productos y realizar compras.</p>
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
            Si tienes alguna pregunta, no dudes en contactarnos.
          </p>
        </div>
      `
    };

    try {
      return await this.sendEmailWithRetry(mailOptions);
    } catch (error) {
      console.error('❌ Error enviando email de bienvenida:', error);
      // No lanzar error para email de bienvenida, es opcional
      return { success: false, error: error.message };
    }
  }

  async sendOrderConfirmation(correo, pedido) {
    const mailOptions = {
      from: `"Confirmación de Pedido" <${ENV_CONFIG.EMAIL.GMAIL_USER}>`,
      to: correo,
      subject: `📦 Confirmación de Pedido #${pedido.id_pedido}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb; text-align: center;">Pedido Confirmado</h2>
          <p>Tu pedido #${pedido.id_pedido} ha sido confirmado.</p>
          <p><strong>Total:</strong> S/ ${pedido.total}</p>
          <p><strong>Estado:</strong> ${pedido.estado}</p>
          <p>Te notificaremos cuando tu pedido esté en camino.</p>
        </div>
      `
    };

    try {
      return await this.sendEmailWithRetry(mailOptions);
    } catch (error) {
      console.error('❌ Error enviando confirmación de pedido:', error);
      return { success: false, error: error.message };
    }
  }
}

// Exportar instancia singleton
export const emailService = new EmailService();
export default emailService;