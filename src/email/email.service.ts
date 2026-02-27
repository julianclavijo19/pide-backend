import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { SendEmailDto, OrderConfirmationEmailDto } from './dto/email.dto';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: Resend | null = null;
  private fromEmail: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('resend.apiKey');
    this.fromEmail = this.configService.get<string>('resend.fromEmail') || 'Pide <noreply@pideapp.com>';

    if (apiKey) {
      this.resend = new Resend(apiKey);
      this.logger.log('Resend email service initialized');
    } else {
      this.logger.warn('RESEND_API_KEY not provided, email service disabled');
    }
  }

  async sendEmail(dto: SendEmailDto): Promise<{ id: string } | null> {
    if (!this.resend) {
      this.logger.warn('Email service not available, skipping email send');
      return null;
    }

    try {
      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: dto.to,
        subject: dto.subject,
        html: dto.html,
        text: dto.text,
      });

      if (error) {
        this.logger.error(`Failed to send email: ${JSON.stringify(error)}`);
        return null;
      }

      this.logger.log(`Email sent successfully: ${data?.id}`);
      return { id: data?.id || '' };
    } catch (error) {
      this.logger.error(`Email send error: ${error}`);
      return null;
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: '¡Bienvenido a Pide! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FF6B35, #F7C948); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">¡Bienvenido a Pide!</h1>
          </div>
          <div style="padding: 30px; background: #ffffff; border: 1px solid #eee; border-radius: 0 0 10px 10px;">
            <p>Hola <strong>${name}</strong>,</p>
            <p>¡Estamos emocionados de tenerte en Pide! Tu cuenta ha sido creada exitosamente.</p>
            <p>Con Pide puedes:</p>
            <ul>
              <li>🍔 Pedir comida de tus restaurantes favoritos</li>
              <li>🚗 Seguir tu pedido en tiempo real</li>
              <li>💬 Chatear con tu repartidor</li>
              <li>⭐ Dejar reseñas y calificaciones</li>
            </ul>
            <p>¡Empieza a pedir ahora!</p>
            <p style="color: #888; font-size: 12px; margin-top: 30px;">
              © ${new Date().getFullYear()} Pide. Todos los derechos reservados.
            </p>
          </div>
        </div>
      `,
    });
  }

  async sendOrderConfirmation(dto: OrderConfirmationEmailDto): Promise<void> {
    const itemsList = dto.items?.map(item =>
      `<li>${item.name} x${item.quantity} - $${item.price}</li>`
    ).join('') || '';

    await this.sendEmail({
      to: dto.to,
      subject: `Pedido #${dto.orderId.slice(0, 8)} confirmado 🛵`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FF6B35, #F7C948); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">¡Pedido Confirmado!</h1>
          </div>
          <div style="padding: 30px; background: #ffffff; border: 1px solid #eee; border-radius: 0 0 10px 10px;">
            <p>Hola <strong>${dto.customerName}</strong>,</p>
            <p>Tu pedido de <strong>${dto.restaurantName}</strong> ha sido confirmado.</p>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <p style="margin: 0;"><strong>Pedido:</strong> #${dto.orderId.slice(0, 8)}</p>
              ${itemsList ? `<ul>${itemsList}</ul>` : ''}
              <p style="margin: 5px 0 0 0; font-size: 18px;"><strong>Total: $${dto.total} COP</strong></p>
            </div>
            <p>Puedes seguir el estado de tu pedido en la app.</p>
            <p style="color: #888; font-size: 12px; margin-top: 30px;">
              © ${new Date().getFullYear()} Pide. Todos los derechos reservados.
            </p>
          </div>
        </div>
      `,
    });
  }

  async sendPasswordReset(to: string, resetToken: string): Promise<void> {
    await this.sendEmail({
      to,
      subject: 'Restablecer contraseña - Pide',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FF6B35, #F7C948); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Restablecer Contraseña</h1>
          </div>
          <div style="padding: 30px; background: #ffffff; border: 1px solid #eee; border-radius: 0 0 10px 10px;">
            <p>Recibimos una solicitud para restablecer tu contraseña.</p>
            <p>Tu código de verificación es:</p>
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px; margin: 15px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #FF6B35;">${resetToken}</span>
            </div>
            <p>Este código expira en 15 minutos.</p>
            <p>Si no solicitaste este cambio, puedes ignorar este email.</p>
            <p style="color: #888; font-size: 12px; margin-top: 30px;">
              © ${new Date().getFullYear()} Pide. Todos los derechos reservados.
            </p>
          </div>
        </div>
      `,
    });
  }
}
