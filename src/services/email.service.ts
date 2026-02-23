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
 *
 * Strip any accidental surrounding/trailing quotes that hosting platforms
 * (Render, Railway, etc.) sometimes include when the value is pasted with
 * quotes, resulting in: TalentOS <noreply@talentos.praneethd.xyz>"
 */
const FROM_EMAIL = (
  process.env.RESEND_FROM_EMAIL || 'TalentOS <noreply@talentos.praneethd.xyz>'
).replace(/^["']+|["']+$/g, '').trim();

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
  // ── pre-flight checks ─────────────────────────────────────────
  if (!process.env.RESEND_API_KEY) {
    console.warn('[Email] ⚠️  RESEND_API_KEY is not set — email skipped.');
    console.warn(`[Email]    Would have sent welcome email to: ${to}`);
    return;
  }

  if (!process.env.RESEND_FROM_EMAIL) {
    console.warn('[Email] ⚠️  RESEND_FROM_EMAIL is not set — using hardcoded fallback.');
  }

  console.log(`[Email] Attempting to send welcome email →`);
  console.log(`[Email]   to      : ${to}`);
  console.log(`[Email]   from    : ${FROM_EMAIL}`);
  console.log(`[Email]   subject : Welcome to ${orgName} — Your TalentOS Account`);

  try {
    const { data, error: resendErr } = await getResend().emails.send({
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

    if (resendErr) {
      const code = (resendErr as Record<string, unknown>).statusCode as number | undefined;
      const msg  = (resendErr as Record<string, unknown>).message as string | undefined;

      console.error('[Email] ❌ Resend API error');
      console.error(`[Email]   to         : ${to}`);
      console.error(`[Email]   from       : ${FROM_EMAIL}`);
      console.error(`[Email]   statusCode : ${code ?? 'unknown'}`);
      console.error(`[Email]   message    : ${msg ?? JSON.stringify(resendErr)}`);

      if (code === 400) {
        console.error('[Email]   cause → 400 Bad Request: malformed request body sent to Resend.');
        console.error('[Email]   check  → "to", "from", "subject", "html" fields are all present and valid.');
      } else if (code === 401) {
        console.error('[Email]   cause → 401 Unauthorized: RESEND_API_KEY is missing or invalid.');
        console.error('[Email]   fix   → Render dashboard → Environment → check RESEND_API_KEY value.');
      } else if (code === 422) {
        console.error('[Email]   cause → 422 Validation Error: one of the email fields failed Resend validation.');
        console.error('[Email]   most likely → "from" address is not a verified Resend domain,');
        console.error(`[Email]              or it contains stray quote characters (current value: "${FROM_EMAIL}").`);
        console.error('[Email]   fix   → Render dashboard → Environment → set RESEND_FROM_EMAIL to exactly:');
        console.error('[Email]           TalentOS <noreply@talentos.praneethd.xyz>  (no surrounding quotes)');
      } else if (code === 429) {
        console.error('[Email]   cause → 429 Rate Limited: too many emails sent in a short period.');
        console.error('[Email]   fix   → add retry logic with exponential backoff, or upgrade Resend plan.');
      } else if (code && code >= 500) {
        console.error(`[Email]   cause → ${code} Resend server error: issue on Resend's side.`);
        console.error('[Email]   fix   → retry later or check https://resend.com/status.');
      } else {
        console.error('[Email]   cause → unexpected error from Resend API.');
        console.error('[Email]   raw   →', JSON.stringify(resendErr));
      }

      return;
    }

    if (data?.id) {
      console.log(`[Email] ✅ Welcome email sent successfully`);
      console.log(`[Email]   resend id : ${data.id}`);
      console.log(`[Email]   to        : ${to}`);
    } else {
      console.warn('[Email] ⚠️  Resend returned no ID — email may not have been queued.');
      console.warn('[Email]   data:', JSON.stringify(data));
    }
  } catch (error: unknown) {
    console.error('[Email] ❌ Exception thrown while sending welcome email (network or SDK error)');
    console.error(`[Email]   to   : ${to}`);
    console.error(`[Email]   from : ${FROM_EMAIL}`);

    const err = error as Record<string, unknown>;

    if (error instanceof Error) {
      const msg = error.message.toLowerCase();
      console.error(`[Email]   message : ${error.message}`);

      if (msg.includes('fetch failed') || msg.includes('econnrefused') || msg.includes('enotfound')) {
        console.error('[Email]   cause → network error: could not reach Resend API.');
        console.error('[Email]   check → outbound HTTPS from this server is allowed.');
      } else if (msg.includes('timeout')) {
        console.error('[Email]   cause → request to Resend timed out.');
      } else if (msg.includes('invalid') && msg.includes('from')) {
        console.error('[Email]   cause → "from" field rejected.');
        console.error(`[Email]   value → "${FROM_EMAIL}"`);
        console.error('[Email]   fix   → set RESEND_FROM_EMAIL in Render env (no surrounding quotes).');
      } else {
        console.error('[Email]   cause → unexpected SDK exception (see stack below).');
      }

      console.error(`[Email]   stack : ${error.stack}`);
    }

    // Surface any Resend-shaped error attached to the exception
    if (err?.statusCode || err?.name) {
      const code = err.statusCode as number | undefined;
      console.error('[Email]   resend error payload →', JSON.stringify({
        name: err.name,
        statusCode: code,
        message: err.message,
      }));

      if (code === 401) console.error('[Email]   hint → 401: invalid RESEND_API_KEY on Render.');
      if (code === 422) console.error('[Email]   hint → 422: invalid from/to format or unverified domain.');
      if (code === 429) console.error('[Email]   hint → 429: rate limit hit — slow down or upgrade plan.');
      if (code && code >= 500) console.error('[Email]   hint → 5xx: Resend server error, retry later.');
    }
  }
};
