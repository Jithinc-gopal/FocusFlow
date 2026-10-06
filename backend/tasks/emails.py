from django.conf import settings
from django.core.mail import send_mail
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from .tokens import email_verification_token


def send_verification_email(user):
    """
    Generate verification token and send verification email to user.
    The email includes both the frontend verification link and the direct API link.
    """
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = email_verification_token.make_token(user)

    frontend_base = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173').rstrip('/')
    frontend_url = f"{frontend_base}/verify-email?uid={uid}&token={token}"
    api_url = f"http://127.0.0.1:8000/api/auth/verify-email/?uid={uid}&token={token}"

    subject = "Verify your FocusFlow account"
    message = f"""Hello {user.username},

Thank you for registering with FocusFlow!

Please confirm your email address by opening the verification link below:

{frontend_url}

Direct API verification URL:
{api_url}

Once verified, you will be able to sign in to your FocusFlow workspace.
If you did not create an account on FocusFlow, you can safely ignore this email.

Best regards,
The FocusFlow Team
"""
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'FocusFlow <noreply@focusflow.app>')
    send_mail(
        subject=subject,
        message=message,
        from_email=from_email,
        recipient_list=[user.email],
        fail_silently=False,
    )
    return frontend_url
