import random
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from html import escape

from backend.common.config import settings
from backend.common.helpers import utc_now_str, future_time_str
from backend.database.db import get_db


def generate_otp(length: int = 6) -> str:
    return "".join(str(random.randint(0, 9)) for _ in range(length))


def get_email_purpose_title(purpose: str) -> str:
    purpose_map = {
        "register": "Verify your SecureAuth sign-up",
        "change_email": "Verify your SecureAuth email change",
        "delete_account": "Confirm your SecureAuth account action",
        "login": "Verify your SecureAuth login",
    }

    return purpose_map.get(purpose, "Your SecureAuth verification code")


def get_email_purpose_message(purpose: str) -> str:
    purpose_map = {
        "register": "We received a sign-up attempt for SecureAuth. Please enter the following code in the browser window where you started registration.",
        "change_email": "We received a request to change your SecureAuth account email. Please enter the following code to verify this email address.",
        "delete_account": "We received an account deletion request. Please enter the following code only if you requested this action.",
        "login": "We received a login verification request. Please enter the following code to continue.",
    }

    return purpose_map.get(
        purpose,
        "Please use the following verification code to continue.",
    )


def build_otp_email_html(
    otp_code: str,
    purpose: str = "register",
    username: str | None = None,
    expiry_minutes: int | None = None,
) -> str:
    safe_otp = escape(otp_code)
    safe_username = escape(username or "User")
    expiry = expiry_minutes or settings.EMAIL_OTP_EXPIRY_MINUTES

    title = get_email_purpose_title(purpose)
    message = get_email_purpose_message(purpose)

    safe_title = escape(title)
    safe_message = escape(message)

    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{safe_title}</title>
</head>

<body style="margin:0; padding:0; background:#f4f4f7; font-family:Arial, Helvetica, sans-serif; color:#202124;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f4f7; padding:28px 12px;">
    <tr>
      <td align="center">

        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px; background:#ffffff; border:1px solid #e5e7eb; border-radius:18px; overflow:hidden;">
          
          <tr>
            <td align="center" style="padding:38px 32px 18px 32px;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                    <td style="vertical-align:middle;">
                    <div style="width:28px; height:24px; display:inline-block;">
                        <div style="width:14px; height:5px; background:#111827; border-radius:2px; margin:2px 0 3px 0;"></div>
                        <div style="width:20px; height:5px; background:#111827; border-radius:2px; margin:0 0 3px 0;"></div>
                        <div style="width:10px; height:5px; background:#111827; border-radius:2px;"></div>
                    </div>
                    </td>
                    <td style="vertical-align:middle; padding-left:10px;">
                    <div style="font-size:28px; font-weight:800; letter-spacing:0.5px; color:#111827; text-transform:uppercase;">
                        SecureAuth
                    </div>
                    </td>
                </tr>
                </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:22px 40px 8px 40px;">
              <h1 style="margin:0; font-size:28px; line-height:1.25; font-weight:700; color:#111827;">
                {safe_title}
              </h1>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:12px 48px 8px 48px;">
              <p style="margin:0; font-size:16px; line-height:1.65; color:#374151;">
                Hello <strong>{safe_username}</strong>,
              </p>
              <p style="margin:12px 0 0 0; font-size:16px; line-height:1.65; color:#374151;">
                {safe_message}
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:24px 48px;">
              <div style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:14px; padding:28px 18px;">
                <div style="font-size:38px; line-height:1; font-weight:800; letter-spacing:8px; color:#111827;">
                  {safe_otp}
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:0 48px 24px 48px;">
              <p style="margin:0; font-size:15px; line-height:1.6; color:#6b7280;">
                This code will remain active for <strong>{expiry} minutes</strong>.
                Do not share this code with anyone.
              </p>
              <p style="margin:12px 0 0 0; font-size:15px; line-height:1.6; color:#6b7280;">
                If you did not request this code, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:8px 48px 34px 48px;">
              <div style="height:1px; background:#e5e7eb; width:75%; margin:0 auto 22px auto;"></div>

              <p style="margin:0; font-size:14px; line-height:1.6; color:#6b7280;">
                SecureAuth, a secure authentication system with email OTP, MFA, session control, and audit monitoring.
              </p>

              <p style="margin:18px 0 0 0; font-size:12px; color:#9ca3af;">
                © 2026 SecureAuth. All rights reserved.
              </p>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>
</body>
</html>
"""


def build_plain_otp_email(
    otp_code: str,
    purpose: str = "register",
    username: str | None = None,
    expiry_minutes: int | None = None,
) -> str:
    expiry = expiry_minutes or settings.EMAIL_OTP_EXPIRY_MINUTES
    title = get_email_purpose_title(purpose)
    message = get_email_purpose_message(purpose)

    return (
        f"{title}\n\n"
        f"Hello {username or 'User'},\n\n"
        f"{message}\n\n"
        f"Your verification code is: {otp_code}\n\n"
        f"This code is valid for {expiry} minutes.\n"
        f"Do not share this code with anyone.\n\n"
        f"If you did not request this code, please ignore this email.\n\n"
        f"SecureAuth"
    )


def send_email(
    subject: str,
    recipient: str,
    body: str,
    html_body: str | None = None,
) -> bool:
    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = settings.SMTP_EMAIL
    message["To"] = recipient

    plain_part = MIMEText(body, "plain", "utf-8")
    message.attach(plain_part)

    if html_body:
        html_part = MIMEText(html_body, "html", "utf-8")
        message.attach(html_part)

    if not settings.SMTP_EMAIL or not settings.SMTP_PASSWORD:
        print("[EMAIL ERROR] SMTP_EMAIL or SMTP_PASSWORD is missing.")
        return False

    try:
        context = ssl.create_default_context()

        with smtplib.SMTP(
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            timeout=settings.SMTP_TIMEOUT_SECONDS,
        ) as server:
            server.starttls(context=context)
            server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_EMAIL, recipient, message.as_string())

        return True

    except Exception as exc:
        print(f"[EMAIL ERROR] Failed to send email to {recipient}: {exc}")
        return False


def save_email_otp(
    email: str,
    otp_code: str,
    purpose: str,
    username: str | None = None,
) -> None:
    with get_db() as conn:
        conn.execute(
            """
            INSERT INTO pending_email_verifications (
                email, otp_code, purpose, username,
                expires_at, is_used, created_at
            )
            VALUES (?, ?, ?, ?, ?, 0, ?)
            """,
            (
                email,
                otp_code,
                purpose,
                username,
                future_time_str(minutes=settings.EMAIL_OTP_EXPIRY_MINUTES),
                utc_now_str(),
            ),
        )


def create_and_send_email_otp(
    email: str,
    purpose: str,
    username: str | None = None,
) -> tuple[bool, str]:
    otp_code = generate_otp(6)

    save_email_otp(
        email=email,
        otp_code=otp_code,
        purpose=purpose,
        username=username,
    )

    subject = get_email_purpose_title(purpose)

    plain_body = build_plain_otp_email(
        otp_code=otp_code,
        purpose=purpose,
        username=username,
        expiry_minutes=settings.EMAIL_OTP_EXPIRY_MINUTES,
    )

    html_body = build_otp_email_html(
        otp_code=otp_code,
        purpose=purpose,
        username=username,
        expiry_minutes=settings.EMAIL_OTP_EXPIRY_MINUTES,
    )

    sent = send_email(
        subject=subject,
        recipient=email,
        body=plain_body,
        html_body=html_body,
    )

    if not sent:
        return False, "Failed to send OTP email."

    return True, "OTP sent successfully."


def verify_email_otp(
    email: str,
    otp_code: str,
    purpose: str,
) -> tuple[bool, str]:
    with get_db() as conn:
        row = conn.execute(
            """
            SELECT *
            FROM pending_email_verifications
            WHERE email = ?
              AND purpose = ?
              AND otp_code = ?
              AND is_used = 0
              AND expires_at > ?
            ORDER BY id DESC
            LIMIT 1
            """,
            (
                email,
                purpose,
                otp_code,
                utc_now_str(),
            ),
        ).fetchone()

        if not row:
            return False, "Invalid or expired OTP."

        conn.execute(
            """
            UPDATE pending_email_verifications
            SET is_used = 1
            WHERE id = ?
            """,
            (row["id"],),
        )

    return True, "Email OTP verified successfully."
