from django.contrib.auth.tokens import PasswordResetTokenGenerator


class EmailVerificationTokenGenerator(PasswordResetTokenGenerator):
    """
    Generate and validate email verification tokens.
    Includes is_active and email_verified state in hash value so
    already-used tokens are automatically invalidated.
    """
    def _make_hash_value(self, user, timestamp):
        return f"{user.pk}{timestamp}{user.is_active}{user.email_verified}"


email_verification_token = EmailVerificationTokenGenerator()
