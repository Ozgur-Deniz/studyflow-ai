import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function buildVerificationEmailHtml(token: string) {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>StudyFlow AI verification code</title>
      </head>
      <body style="margin:0; padding:0; background:#f4fbf6; color:#0f172a; font-family:Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
        <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
          Your StudyFlow AI verification code is ${token}. It expires in 1 hour.
        </div>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%; background:#f4fbf6; padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px; overflow:hidden; border:1px solid #d8f3df; border-radius:22px; background:#ffffff; box-shadow:0 24px 60px rgba(15, 23, 42, 0.10);">
                <tr>
                  <td style="padding:28px 30px 24px; background:linear-gradient(135deg, #0a9f43 0%, #22c55e 58%, #4ade80 100%);">
                    <div style="font-size:12px; font-weight:800; letter-spacing:0.18em; text-transform:uppercase; color:#dcfce7;">
                      Email verification
                    </div>
                    <div style="margin-top:10px; font-size:30px; font-weight:800; line-height:1.1; color:#ffffff;">
                      StudyFlow AI
                    </div>
                    <div style="margin-top:8px; max-width:420px; font-size:14px; font-weight:500; line-height:1.7; color:#ecfdf3;">
                      Confirm your email address to activate your focused learning workspace.
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:30px;">
                    <p style="margin:0; font-size:16px; font-weight:700; color:#102033;">
                      Your verification code
                    </p>
                    <p style="margin:10px 0 0; font-size:14px; font-weight:500; line-height:1.7; color:#64748b;">
                      Enter this 6-digit code on the StudyFlow AI verification page. The code is valid for 1 hour.
                    </p>

                    <div style="margin:26px 0; padding:22px 18px; border:1px solid #bbf7d0; border-radius:18px; background:#f0fdf4; text-align:center;">
                      <div style="font-size:34px; font-weight:800; letter-spacing:10px; line-height:1; color:#087b36;">
                        ${token}
                      </div>
                    </div>

                    <p style="margin:0; padding:14px 16px; border-radius:14px; background:#f8fafc; font-size:13px; font-weight:500; line-height:1.6; color:#64748b;">
                      If you did not create a StudyFlow AI account, you can ignore this email.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:20px 30px; background:#087b36;">
                    <div style="font-size:15px; font-weight:800; color:#ffffff;">
                      StudyFlow AI
                    </div>
                    <div style="margin-top:5px; font-size:12px; font-weight:500; line-height:1.6; color:#dcfce7;">
                      Plan smarter. Practice better. Keep your progress visible.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function buildPasswordResetEmailHtml(token: string) {
  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>StudyFlow AI password reset code</title>
      </head>
      <body style="margin:0; padding:0; background:#f4fbf6; color:#0f172a; font-family:Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
        <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
          Your StudyFlow AI password reset code is ${token}. It expires in 1 hour.
        </div>

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%; background:#f4fbf6; padding:32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px; overflow:hidden; border:1px solid #d8f3df; border-radius:22px; background:#ffffff; box-shadow:0 24px 60px rgba(15, 23, 42, 0.10);">
                <tr>
                  <td style="padding:28px 30px 24px; background:linear-gradient(135deg, #0a9f43 0%, #22c55e 58%, #4ade80 100%);">
                    <div style="font-size:12px; font-weight:800; letter-spacing:0.18em; text-transform:uppercase; color:#dcfce7;">
                      Password reset
                    </div>
                    <div style="margin-top:10px; font-size:30px; font-weight:800; line-height:1.1; color:#ffffff;">
                      StudyFlow AI
                    </div>
                    <div style="margin-top:8px; max-width:420px; font-size:14px; font-weight:500; line-height:1.7; color:#ecfdf3;">
                      Use this code to create a new password for your account.
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding:30px;">
                    <p style="margin:0; font-size:16px; font-weight:700; color:#102033;">
                      Your password reset code
                    </p>
                    <p style="margin:10px 0 0; font-size:14px; font-weight:500; line-height:1.7; color:#64748b;">
                      Enter this 6-digit code on the StudyFlow AI password reset page. The code is valid for 1 hour.
                    </p>

                    <div style="margin:26px 0; padding:22px 18px; border:1px solid #bbf7d0; border-radius:18px; background:#f0fdf4; text-align:center;">
                      <div style="font-size:34px; font-weight:800; letter-spacing:10px; line-height:1; color:#087b36;">
                        ${token}
                      </div>
                    </div>

                    <p style="margin:0; padding:14px 16px; border-radius:14px; background:#f8fafc; font-size:13px; font-weight:500; line-height:1.6; color:#64748b;">
                      If you did not request a password reset, you can safely ignore this email.
                    </p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:20px 30px; background:#087b36;">
                    <div style="font-size:15px; font-weight:800; color:#ffffff;">
                      StudyFlow AI
                    </div>
                    <div style="margin-top:5px; font-size:12px; font-weight:500; line-height:1.6; color:#dcfce7;">
                      Plan smarter. Practice better. Keep your progress visible.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export async function sendVerificationEmail(email: string, token: string) {
  try {
    const { error } = await resend.emails.send({
      from: "StudyFlow AI <onboarding@resend.dev>",
      to: email,
      subject: "Your StudyFlow AI verification code",
      html: buildVerificationEmailHtml(token),
    });

    if (error) {
      console.error("Verification email could not be sent:", error);
      throw new Error("Verification email could not be sent.");
    }
  } catch (error) {
    console.error("Verification email could not be sent:", error);
    throw error;
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  try {
    const { error } = await resend.emails.send({
      from: "StudyFlow AI <onboarding@resend.dev>",
      to: email,
      subject: "Your StudyFlow AI password reset code",
      html: buildPasswordResetEmailHtml(token),
    });

    if (error) {
      console.error("Password reset email could not be sent:", error);
      throw new Error("Password reset email could not be sent.");
    }
  } catch (error) {
    console.error("Password reset email could not be sent:", error);
    throw error;
  }
}
