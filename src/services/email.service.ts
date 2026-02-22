import { Resend } from 'resend';

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY || '');
  }
  return resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@talentos.app';

/**
 * Send welcome email to a new employee with their login credentials
 *
 * @param to - Employee email address
 * @param name - Employee name
 * @param password - Plain-text temporary password
 * @param orgName - Organization name
 */
export const sendWelcomeEmail = async (
  to: string,
  name: string,
  password: string,
  orgName: string
): Promise<void> => {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email] Skipped (no RESEND_API_KEY). Would send welcome email to ${to}`);
    return;
  }

  try {
    await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Welcome to ${orgName} on TalentOS`,
      html: `
        <h2>Welcome to TalentOS, ${name}!</h2>
        <p>Your account has been created by <strong>${orgName}</strong>.</p>
        <p>Use the credentials below to log in:</p>
        <table style="border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;font-weight:bold;">Email:</td><td style="padding:8px;">${to}</td></tr>
          <tr><td style="padding:8px;font-weight:bold;">Password:</td><td style="padding:8px;font-family:monospace;background:#f4f4f4;border-radius:4px;">${password}</td></tr>
        </table>
        <p>Please change your password after your first login.</p>
        <p style="color:#888;font-size:12px;">— TalentOS</p>
      `,
    });
    console.log(`Welcome email sent to ${to}`);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
};
