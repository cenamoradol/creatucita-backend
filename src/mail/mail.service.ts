import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private mailerService: MailerService) {}

  async sendAppointmentConfirmation(email: string, clientName: string, specialistName: string, date: string, time: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Cita Confirmada - CreaTuCita',
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
            <h2>¡Hola ${clientName}!</h2>
            <p>Tu cita ha sido agendada con éxito.</p>
            <hr />
            <p><strong>Especialista:</strong> ${specialistName}</p>
            <p><strong>Fecha:</strong> ${date}</p>
            <p><strong>Hora:</strong> ${time}</p>
            <hr />
            <p>Te recomendamos llegar 5 minutos antes.</p>
            <p>Atentamente,<br />El equipo de CreaTuCita</p>
          </div>
        `,
      });
      this.logger.log(`Email de confirmación enviado a: ${email}`);
    } catch (error) {
      this.logger.error(`Error enviando email a ${email}: ${error.message}`);
    }
  }

  async sendNewAppointmentNotification(email: string, specialistName: string, clientName: string, date: string, time: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Nueva Cita Agendada - CreaTuCita',
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
            <h2>¡Hola ${specialistName}!</h2>
            <p>Tienes una nueva cita agendada en tu plataforma.</p>
            <hr />
            <p><strong>Cliente:</strong> ${clientName}</p>
            <p><strong>Fecha:</strong> ${date}</p>
            <p><strong>Hora:</strong> ${time}</p>
            <hr />
            <p>Puedes gestionar tus citas en tu panel de especialista.</p>
          </div>
        `,
      });
      this.logger.log(`Notificación de nueva cita enviada a: ${email}`);
    } catch (error) {
      this.logger.error(`Error enviando notificación a ${email}: ${error.message}`);
    }
  }

  async sendPasswordResetEmail(email: string, resetCode: string) {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Recuperar Contraseña - CreaTuCita',
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
            <h2>Recuperar tu contraseña</h2>
            <p>Has solicitado recuperar tu contraseña. Usa el siguiente código:</p>
            <h1 style="color: #4F46E5; font-size: 32px;">${resetCode}</h1>
            <p>Este código expira en 1 hora.</p>
            <p>Si no solicitaste esto, ignora este correo.</p>
          </div>
        `,
      });
      this.logger.log(`Email de recuperación enviado a: ${email}`);
    } catch (error) {
      this.logger.error(`Error enviando email de recuperación a ${email}: ${error.message}`);
    }
  }
}
