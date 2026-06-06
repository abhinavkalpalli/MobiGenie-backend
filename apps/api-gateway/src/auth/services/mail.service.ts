import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST'),
      port: this.config.get<number>('MAIL_PORT'),
      secure: false,
      auth: {
        user: this.config.get<string>('MAIL_USER'),
        pass: this.config.get<string>('MAIL_PASS'),
      },
    });
  }

  async sendOtp(to: string, otp: string, purpose: 'verify' | 'reset') {
    const subject = purpose === 'verify'
      ? 'MobiGenie — Verify your email'
      : 'MobiGenie — Reset your password';

    const title = purpose === 'verify' ? 'Email Verification' : 'Password Reset';
    const message = purpose === 'verify'
      ? 'Use the OTP below to verify your email address.'
      : 'Use the OTP below to reset your password.';

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;background:#1a1a2e;color:#e2e2f0;border-radius:12px;padding:32px;border:1px solid #2e2e4a">
        <div style="text-align:center;margin-bottom:24px">
          <h1 style="color:#a78bfa;font-size:22px;margin:0">MobiGenie</h1>
          <p style="color:#6b6b8a;font-size:13px;margin:4px 0 0">AI Phone Advisor</p>
        </div>
        <h2 style="font-size:18px;color:#e2e2f0;margin-bottom:8px">${title}</h2>
        <p style="color:#8b8ba7;font-size:14px;margin-bottom:24px">${message}</p>
        <div style="text-align:center;background:#13131f;border-radius:12px;padding:24px;border:1px solid #2e2e4a;margin-bottom:24px">
          <span style="font-size:36px;font-weight:bold;letter-spacing:12px;color:#a78bfa">${otp}</span>
        </div>
        <p style="color:#6b6b8a;font-size:12px;text-align:center">This OTP expires in <strong style="color:#e2e2f0">10 minutes</strong>. Do not share it with anyone.</p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('MAIL_FROM'),
        to,
        subject,
        html,
      });
      this.logger.log(`OTP sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send OTP to ${to}: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  }
}
