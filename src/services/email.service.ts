import { Resend } from 'resend';

let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY || '');
  }
  return resend;
}

/**
 * Branded sender — must match a Resend-verified domain.
 * Uses RESEND_FROM_EMAIL env var which should be in the form:
 *   TalentOS <noreply@talentos.praneethd.xyz>
 */
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'TalentOS <noreply@talentos.praneethd.xyz>';

const LOGIN_URL = 'https://talentos.praneethd.xyz/login';

/**
 * Send welcome email to a new employee with their login credentials.
 * Silently skips if RESEND_API_KEY is not set (dev/test environments).
 *
 * @param to       - Employee email address
 * @param name     - Employee full name
 * @param password - Plain-text temporary password (hashed copy already saved to DB)
 * @param orgName  - Organization name
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
      subject: `Welcome to ${orgName} — Your TalentOS Account`,
      html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f6fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fa;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.07);">
          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:32px 40px;text-align:center;">
              <span style="color:#14b8a6;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Talent<span style="color:#ffffff;">OS</span></span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f172a;">Welcome, ${name}! 👋</h1>
              <p style="margin:0 0 24px;color:#64748b;font-size:15px;">
                <strong>${orgName}</strong> has added you to TalentOS. Use the credentials below to log in and get started.
              </p>

              <!-- Credentials box -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;">Your login credentials</p>
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#64748b;width:90px;">Email</td>
                        <td style="padding:4px 0;font-size:13px;font-weight:600;color:#0f172a;">${to}</td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;font-size:13px;color:#64748b;">Password</td>
                        <td style="padding:4px 0;">
                          <span style="font-family:monospace;font-size:14px;font-weight:700;color:#0f172a;background:#e2e8f0;padding:3px 10px;border-radius:6px;">${password}</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="background:#14b8a6;border-radius:10px;">
                    <a href="${LOGIN_URL}" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">
                      Sign In as Employee →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">
                On the login page, select the <strong>Employee</strong> tab and use the credentials above.
                You can change your password any time from your profile page.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #f1f5f9;text-align:center;">
              <p style="margin:0;font-size:12px;color:#cbd5e1;">© ${new Date().getFullYear()} TalentOS · AI-Native Workforce Intelligence</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });
    console.log(`[Email] Welcome email sent to ${to}`);
  } catch (error) {
    console.error('[Email] Failed to send welcome email:', error);
  }
};
