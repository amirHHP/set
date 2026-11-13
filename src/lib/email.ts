import tls from 'tls';
import net from 'net';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
}

function getSmtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST;
  if (!host) return null;

  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user || 'no-reply@set-fitness.ir';

  return { host, port, secure, user, pass, from };
}

/**
 * Minimal dependency-free SMTP client using Node's standard tls/net library.
 */
async function sendRawSmtp(config: SmtpConfig, options: SendEmailOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    let socket: net.Socket;
    const timeoutMs = 10000;

    const cleanup = () => {
      if (socket) {
        socket.removeAllListeners();
        socket.destroy();
      }
    };

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('SMTP connection timed out'));
    }, timeoutMs);

    const onConnect = () => {
      let stage = 0;
      let buffer = '';

      const send = (cmd: string) => {
        socket.write(cmd + '\r\n');
      };

      socket.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\r\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const code = parseInt(line.substring(0, 3), 10);
          const isFinal = line.charAt(3) === ' ';

          if (!isFinal || isNaN(code)) continue;

          if (code >= 400) {
            clearTimeout(timer);
            cleanup();
            return reject(new Error(`SMTP Error (${code}): ${line}`));
          }

          if (stage === 0 && code === 220) {
            stage = 1;
            send(`EHLO localhost`);
          } else if (stage === 1 && code === 250) {
            if (config.user && config.pass) {
              stage = 2;
              send('AUTH LOGIN');
            } else {
              stage = 4;
              send(`MAIL FROM:<${config.from}>`);
            }
          } else if (stage === 2 && code === 334) {
            stage = 3;
            send(Buffer.from(config.user || '').toString('base64'));
          } else if (stage === 3 && code === 334) {
            stage = 4;
            send(Buffer.from(config.pass || '').toString('base64'));
          } else if (stage === 4 && (code === 235 || code === 250)) {
            stage = 5;
            send(`MAIL FROM:<${config.from}>`);
          } else if (stage === 5 && code === 250) {
            stage = 6;
            send(`RCPT TO:<${options.to}>`);
          } else if (stage === 6 && code === 250) {
            stage = 7;
            send('DATA');
          } else if (stage === 7 && code === 354) {
            stage = 8;
            const message = [
              `From: ${config.from}`,
              `To: ${options.to}`,
              `Subject: =?UTF-8?B?${Buffer.from(options.subject).toString('base64')}?=`,
              'MIME-Version: 1.0',
              'Content-Type: text/html; charset=UTF-8',
              'Content-Transfer-Encoding: base64',
              '',
              Buffer.from(options.html).toString('base64'),
              '.',
            ].join('\r\n');
            send(message);
          } else if (stage === 8 && code === 250) {
            stage = 9;
            send('QUIT');
            clearTimeout(timer);
            cleanup();
            resolve();
            return;
          }
        }
      });
    };

    if (config.secure) {
      socket = tls.connect({ host: config.host, port: config.port }, onConnect);
    } else {
      socket = net.connect({ host: config.host, port: config.port }, onConnect);
    }

    socket.on('error', (err) => {
      clearTimeout(timer);
      cleanup();
      reject(err);
    });
  });
}

export async function sendOtpEmail(to: string, code: string): Promise<{ success: boolean; devMode?: boolean; devCode?: string; error?: string }> {
  const config = getSmtpConfig();
  const subject = `کد تایید ورود و ثبت‌نام سِت: ${code}`;
  const html = `
    <div dir="rtl" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 32px 24px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.1);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #ec4899; margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">سِت | SET</h1>
        <p style="color: #94a3b8; font-size: 14px; margin-top: 6px;">سامانه اختصاصی سلامت و تناسب اندام بانوان</p>
      </div>

      <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="font-size: 15px; margin-top: 0; margin-bottom: 16px; color: #cbd5e1;">کد تایید یک‌بار مصرف شما جهت تکمیل ثبت‌نام:</p>
        <div style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #f43f5e; background: rgba(244,63,94,0.1); padding: 14px 20px; border-radius: 10px; display: inline-block; font-family: monospace;">
          ${code}
        </div>
        <p style="font-size: 12px; color: #94a3b8; margin-top: 16px; margin-bottom: 0;">این کد به مدت <strong style="color: #f8fafc;">۵ دقیقه</strong> معتبر است.</p>
      </div>

      <p style="font-size: 12px; color: #64748b; line-height: 1.6; text-align: center; margin: 0;">
        اگر شما درخواست این کد را ثبت نکرده‌اید، می‌توانید این ایمیل را نادیده بگیرید. از اشتراک‌گذاری این کد با دیگران اکیداً خودداری فرمایید.
      </p>
    </div>
  `;

  if (!config) {
    // Development or unconfigured SMTP fallback: log clearly in server console
    console.log('\n======================================================');
    console.log('📧 [SET FITNESS] ایمیل کد تایید (OTP)');
    console.log(`گیرنده: ${to}`);
    console.log(`کد تایید ۶ رقمی: ${code}`);
    console.log('اعتبار: ۵ دقیقه');
    console.log('نکته: برای ارسال واقعی، متغیرهای SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS را تنظیم کنید.');
    console.log('======================================================\n');

    return {
      success: true,
      devMode: true,
      devCode: code,
    };
  }

  try {
    await sendRawSmtp(config, { to, subject, html });
    return { success: true };
  } catch (error: any) {
    console.error('Failed to send OTP via SMTP:', error);
    // If SMTP fails, log fallback in console so testing is not blocked
    console.log(`⚠️ SMTP ارسال نشد. کد تایید برای ${to}: ${code}`);
    return {
      success: false,
      error: 'خطا در ارسال ایمیل. لطفاً دقایقی دیگر تلاش کنید یا با پشتیبانی تماس بگیرید.',
    };
  }
}
