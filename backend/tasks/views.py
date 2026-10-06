import calendar
import datetime
import json
import logging
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
from rest_framework import permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

from .emails import send_verification_email
from .models import Category, Expense, Task, TaskActivity
from .serializers import (
    CategorySerializer,
    ExpenseSerializer,
    LoginSerializer,
    RegisterSerializer,
    ResendVerificationSerializer,
    TaskActivitySerializer,
    TaskSerializer,
    UserSerializer,
)
from .tokens import email_verification_token

User = get_user_model()


class RegisterView(APIView):
    """
    POST /api/auth/register/
    Register a new user, creates an inactive unverified account,
    and sends a verification email.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        send_verification_email(user)
        return Response(
            {
                "message": "Registration successful. Please check your email to verify your account.",
                "email": user.email,
                "username": user.username,
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    """
    POST /api/auth/login/
    Authenticate with email and password.
    Rejects incorrect credentials, unverified accounts, and inactive accounts.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.check_password(password):
            return Response(
                {"detail": "Invalid email or password."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        if not user.email_verified:
            return Response(
                {
                    "detail": "Email has not been verified. Please verify your email before logging in.",
                    "unverified": True,
                    "email": user.email,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        if not user.is_active:
            return Response(
                {
                    "detail": "Your account is currently inactive. Please contact support or verify your email.",
                    "inactive": True,
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response(
            {
                "token": token.key,
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )


class VerifyEmailView(APIView):
    """
    GET /api/auth/verify-email/
    Verifies user email using uid and token parameters.
    Activates the account and marks email as verified.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        uid = request.query_params.get('uid')
        token = request.query_params.get('token')

        if not uid or not token:
            return Response(
                {"detail": "Missing uid or token parameter."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_id = force_str(urlsafe_base64_decode(uid))
            user = User.objects.get(pk=user_id)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response(
                {"detail": "Invalid verification link. User not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if user.email_verified and user.is_active:
            return Response(
                {
                    "detail": "Email is already verified. You can now log in.",
                    "already_verified": True,
                },
                status=status.HTTP_200_OK,
            )

        if not email_verification_token.check_token(user, token):
            return Response(
                {"detail": "Verification link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.email_verified = True
        user.is_active = True
        user.save()

        return Response(
            {"detail": "Email verified successfully! You can now log in."},
            status=status.HTTP_200_OK,
        )


class ResendVerificationView(APIView):
    """
    POST /api/auth/resend-verification/
    Resends verification email to an unverified user.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResendVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data['email']
        user = User.objects.filter(email__iexact=email).first()

        if not user:
            return Response(
                {"detail": "No account found with this email address."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if user.email_verified and user.is_active:
            return Response(
                {"detail": "This account is already verified. Please log in."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        send_verification_email(user)
        return Response(
            {"detail": "Verification email resent successfully. Please check your inbox or terminal."},
            status=status.HTTP_200_OK,
        )


class TaskListCreateView(APIView):
    """
    GET  /api/tasks/  - List all tasks for authenticated user.
    POST /api/tasks/  - Create a new task for authenticated user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tasks = Task.objects.filter(user=request.user).order_by('-created_at')
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = TaskSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        category = serializer.validated_data.get('category')
        if category and category.user != request.user:
            return Response(
                {"category": ["Invalid category."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        completed = serializer.validated_data.get('completed', False)
        completed_at = timezone.now() if completed else None

        task = serializer.save(user=request.user, completed_at=completed_at)
        return Response(TaskSerializer(task).data, status=status.HTTP_201_CREATED)


class TaskDetailView(APIView):
    """
    GET    /api/tasks/<id>/ - Retrieve a task belonging to authenticated user.
    PATCH  /api/tasks/<id>/ - Update a task belonging to authenticated user.
    DELETE /api/tasks/<id>/ - Delete a task belonging to authenticated user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return Task.objects.get(pk=pk, user=user)
        except Task.DoesNotExist:
            return None

    def get(self, request, pk=None, id=None):
        task_id = pk if pk is not None else id
        task = self.get_object(task_id, request.user)
        if not task:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = TaskSerializer(task)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk=None, id=None):
        task_id = pk if pk is not None else id
        task = self.get_object(task_id, request.user)
        if not task:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = TaskSerializer(task, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        if 'category' in serializer.validated_data:
            category = serializer.validated_data['category']
            if category and category.user != request.user:
                return Response(
                    {"category": ["Invalid category."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if 'completed' in serializer.validated_data:
            new_completed = serializer.validated_data['completed']
            if not task.completed and new_completed:
                task = serializer.save(completed_at=timezone.now())
                try:
                    TaskActivity.objects.get_or_create(
                        user=task.user,
                        task=task,
                        activity_date=timezone.localdate(),
                        activity_type=TaskActivity.ActivityType.COMPLETED,
                    )
                except IntegrityError:
                    pass
            elif task.completed and not new_completed:
                serializer.save(completed_at=None)
            else:
                serializer.save()
        else:
            serializer.save()

        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk=None, id=None):
        return self.patch(request, pk=pk, id=id)

    def delete(self, request, pk=None, id=None):
        task_id = pk if pk is not None else id
        task = self.get_object(task_id, request.user)
        if not task:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        task.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class CategoryListCreateView(APIView):
    """
    GET  /api/categories/ - List all categories for authenticated user.
    POST /api/categories/ - Create a new category for authenticated user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        categories = Category.objects.filter(user=request.user).order_by('name')
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        name = serializer.validated_data.get('name').strip()
        if Category.objects.filter(user=request.user, name__iexact=name).exists():
            return Response(
                {"name": ["A category with this name already exists."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            category = serializer.save(user=request.user, name=name)
        except IntegrityError:
            return Response(
                {"name": ["A category with this name already exists."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(CategorySerializer(category).data, status=status.HTTP_201_CREATED)


class CategoryDetailView(APIView):
    """
    GET    /api/categories/<id>/ - Retrieve category belonging to authenticated user.
    PATCH  /api/categories/<id>/ - Update category belonging to authenticated user.
    DELETE /api/categories/<id>/ - Delete category belonging to authenticated user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return Category.objects.get(pk=pk, user=user)
        except Category.DoesNotExist:
            return None

    def get(self, request, pk=None, id=None):
        category_id = pk if pk is not None else id
        category = self.get_object(category_id, request.user)
        if not category:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = CategorySerializer(category)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk=None, id=None):
        category_id = pk if pk is not None else id
        category = self.get_object(category_id, request.user)
        if not category:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = CategorySerializer(category, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        name = serializer.validated_data.get('name')
        if name:
            trimmed = name.strip()
            if Category.objects.filter(user=request.user, name__iexact=trimmed).exclude(pk=category.pk).exists():
                return Response(
                    {"name": ["A category with this name already exists."]},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            serializer.validated_data['name'] = trimmed

        try:
            serializer.save()
        except IntegrityError:
            return Response(
                {"name": ["A category with this name already exists."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk=None, id=None):
        return self.patch(request, pk=pk, id=id)

    def delete(self, request, pk=None, id=None):
        category_id = pk if pk is not None else id
        category = self.get_object(category_id, request.user)
        if not category:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TaskActivityListView(APIView):
    """
    GET /api/task-activities/ - List all task activities for authenticated user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        activities = (
            TaskActivity.objects.filter(user=request.user)
            .select_related('task')
            .order_by('-activity_date', '-created_at')
        )
        serializer = TaskActivitySerializer(activities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class HolidayListView(APIView):
    """
    GET /api/holidays/?year=YYYY
    Returns real holiday data for India & Kerala for a given year.
    Calls Calendarific API if CALENDARIFIC_API_KEY is configured.
    Falls back to the live open Kerala holiday feed if key is absent or on failure.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        year_str = request.query_params.get('year')
        now_year = timezone.now().year
        if not year_str:
            year = now_year
        else:
            try:
                year = int(year_str)
                if year < 1900 or year > 2100:
                    return Response(
                        {"detail": "Year must be between 1900 and 2100."},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            except (ValueError, TypeError):
                return Response(
                    {"detail": "Invalid year parameter."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        holidays = []
        source_used = None

        # 1. Try Calendarific API if key is configured
        api_key = getattr(settings, 'CALENDARIFIC_API_KEY', '') or os.getenv('CALENDARIFIC_API_KEY', '')
        if api_key:
            try:
                cal_url = (
                    f"https://calendarific.com/api/v2/holidays?"
                    f"api_key={urllib.parse.quote(api_key)}"
                    f"&country=IN&year={year}&location=in-kl"
                )
                req = urllib.request.Request(
                    cal_url,
                    headers={'User-Agent': 'FocusFlow-Calendar/1.0'}
                )
                with urllib.request.urlopen(req, timeout=6) as response:
                    if response.status == 200:
                        data = json.loads(response.read().decode('utf-8'))
                        raw_holidays = data.get('response', {}).get('holidays', [])
                        for h in raw_holidays:
                            iso_str = h.get('date', {}).get('iso', '')
                            clean_date = iso_str.split('T')[0] if iso_str else ''
                            h_name = h.get('name', '').strip()
                            h_type = h.get('primary_type') or (h.get('type') and h['type'][0]) or 'Public Holiday'
                            if clean_date and h_name:
                                holidays.append({
                                    'date': clean_date,
                                    'name': h_name,
                                    'type': h_type,
                                })
                        if holidays:
                            source_used = "Calendarific API"
            except Exception as e:
                logger.warning(f"Calendarific API request failed: {e}")

        # 2. If no Calendarific holidays obtained, query the live Kerala feed
        if not holidays:
            try:
                feed_url = "https://www.officeholidays.com/ics/india/kerala"
                req = urllib.request.Request(
                    feed_url,
                    headers={'User-Agent': 'FocusFlow-Calendar/1.0'}
                )
                with urllib.request.urlopen(req, timeout=8) as response:
                    if response.status == 200:
                        feed_text = response.read().decode('utf-8', errors='ignore')
                        events = feed_text.split('BEGIN:VEVENT')[1:]
                        seen_keys = set()
                        for ev in events:
                            d_match = re.search(r'DTSTART(?:;[^:]+)?:(\d{4})(\d{2})(\d{2})', ev)
                            s_match = re.search(r'SUMMARY(?:;[^:]+)?:([^\r\n]+)', ev)
                            if not (d_match and s_match):
                                continue

                            ev_year = int(d_match.group(1))
                            if ev_year != year:
                                continue

                            date_str = f"{d_match.group(1)}-{d_match.group(2)}-{d_match.group(3)}"
                            raw_summary = s_match.group(1).strip()

                            clean_name = re.sub(r'^(Kerala|India):\s*', '', raw_summary)
                            h_type = "State Holiday"
                            type_match = re.search(r'\(([^)]+Holiday|Observance|Gazetted[^)]*)\)$', clean_name, re.I)
                            if type_match:
                                h_type = type_match.group(1)
                                clean_name = re.sub(r'\s*\([^)]+\)$', '', clean_name).strip()
                            elif 'Republic Day' in clean_name or 'Independence Day' in clean_name or 'Gandhi' in clean_name:
                                h_type = "National Holiday"

                            key = (date_str, clean_name)
                            if key not in seen_keys:
                                seen_keys.add(key)
                                holidays.append({
                                    'date': date_str,
                                    'name': clean_name,
                                    'type': h_type,
                                })
                        if holidays:
                            holidays.sort(key=lambda x: x['date'])
                            source_used = "Live Kerala Holiday Feed"
            except Exception as e:
                logger.warning(f"Live Kerala feed request failed: {e}")

        if holidays:
            return Response(
                {
                    "year": year,
                    "source": source_used,
                    "holidays": holidays,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            {
                "year": year,
                "holidays": [],
                "error": "Holiday information is temporarily unavailable.",
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )


class ExpenseListCreateView(APIView):
    """
    GET  /api/expenses/?year=2026&month=10
         List expenses for the authenticated user for the given month.
         Defaults to the current month if year/month are omitted.
    POST /api/expenses/
         Create a new expense for the authenticated user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        year_param = request.query_params.get('year')
        month_param = request.query_params.get('month')

        now = timezone.localdate()
        if not year_param and not month_param:
            target_year = now.year
            target_month = now.month
        else:
            try:
                target_year = int(year_param) if year_param else now.year
                target_month = int(month_param) if month_param else now.month
            except (ValueError, TypeError):
                return Response(
                    {"detail": "Invalid year or month format. Must be integers."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if not (1 <= target_month <= 12):
            return Response(
                {"detail": "Invalid month. Month must be between 1 and 12."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not (1900 <= target_year <= 2100):
            return Response(
                {"detail": "Invalid year. Year must be between 1900 and 2100."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        expenses = Expense.objects.filter(
            user=request.user,
            expense_date__year=target_year,
            expense_date__month=target_month,
        ).order_by('-expense_date', '-created_at')

        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ExpenseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        expense = serializer.save(user=request.user)
        return Response(ExpenseSerializer(expense).data, status=status.HTTP_201_CREATED)


class ExpenseDetailView(APIView):
    """
    GET    /api/expenses/<id>/ - Retrieve an expense belonging to the authenticated user.
    PATCH  /api/expenses/<id>/ - Update an expense belonging to the authenticated user.
    DELETE /api/expenses/<id>/ - Delete an expense belonging to the authenticated user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, pk, user):
        try:
            return Expense.objects.get(pk=pk, user=user)
        except Expense.DoesNotExist:
            return None

    def get(self, request, pk=None, id=None):
        expense_id = pk if pk is not None else id
        expense = self.get_object(expense_id, request.user)
        if not expense:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = ExpenseSerializer(expense)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk=None, id=None):
        expense_id = pk if pk is not None else id
        expense = self.get_object(expense_id, request.user)
        if not expense:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = ExpenseSerializer(expense, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk=None, id=None):
        return self.patch(request, pk=pk, id=id)

    def delete(self, request, pk=None, id=None):
        expense_id = pk if pk is not None else id
        expense = self.get_object(expense_id, request.user)
        if not expense:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        expense.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ExpenseHistoryView(APIView):
    """
    GET /api/expenses/history/
    Returns monthly expense summaries for the authenticated user,
    calculated dynamically from actual expense records.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        history = (
            Expense.objects.filter(user=request.user)
            .annotate(month_start=TruncMonth('expense_date'))
            .values('month_start')
            .annotate(total_amount=Sum('amount'), count=Count('id'))
            .order_by('-month_start')
        )

        results = []
        for entry in history:
            m_date = entry['month_start']
            if isinstance(m_date, (datetime.date, datetime.datetime)):
                year = m_date.year
                month = m_date.month
            else:
                parts = str(m_date).split('-')
                year = int(parts[0])
                month = int(parts[1])

            total_val = entry['total_amount'] or 0
            results.append({
                'year': year,
                'month': month,
                'month_name': calendar.month_name[month],
                'total_amount': f"{total_val:.2f}",
                'count': entry['count'],
            })

        return Response(results, status=status.HTTP_200_OK)


