from datetime import date
from django.contrib.auth import get_user_model
from django.core import mail
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from django.test import TestCase
from django.utils import timezone
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from .models import Category, Expense, Task, TaskActivity
from .serializers import TaskActivitySerializer
from .tokens import email_verification_token

User = get_user_model()


class AuthenticationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/auth/register/'
        self.login_url = '/api/auth/login/'
        self.verify_url = '/api/auth/verify-email/'
        self.resend_url = '/api/auth/resend-verification/'

    def test_01_register_new_user(self):
        """Registering a new user creates an inactive, unverified account and sends verification email."""
        data = {
            'username': 'focus_user',
            'email': 'user@focusflow.app',
            'password': 'StrongPassword123!',
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('Registration successful', response.data['message'])

        user = User.objects.get(email='user@focusflow.app')
        self.assertFalse(user.is_active)
        self.assertFalse(user.email_verified)
        self.assertEqual(user.username, 'focus_user')

        # Confirm verification email was generated in outbox
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('Verify your FocusFlow account', mail.outbox[0].subject)
        self.assertIn('verify-email', mail.outbox[0].body)

    def test_02_duplicate_email_rejected(self):
        """Duplicate email registration is rejected."""
        User.objects.create_user(
            email='test@focusflow.app',
            username='user1',
            password='Password123!',
        )
        data = {
            'username': 'user2',
            'email': 'test@focusflow.app',
            'password': 'Password123!',
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_03_duplicate_username_rejected(self):
        """Duplicate username registration is rejected."""
        User.objects.create_user(
            email='user1@focusflow.app',
            username='same_username',
            password='Password123!',
        )
        data = {
            'username': 'same_username',
            'email': 'user2@focusflow.app',
            'password': 'Password123!',
        }
        response = self.client.post(self.register_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('username', response.data)

    def test_04_login_before_verification_rejected(self):
        """Login before verification is rejected with 403."""
        User.objects.create_user(
            email='unverified@focusflow.app',
            username='unverified_user',
            password='Password123!',
            is_active=False,
            email_verified=False,
        )
        data = {
            'email': 'unverified@focusflow.app',
            'password': 'Password123!',
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(response.data.get('unverified'))

    def test_05_verification_link_activates_account(self):
        """Opening a valid verification URL activates the account and marks email as verified."""
        user = User.objects.create_user(
            email='verify_me@focusflow.app',
            username='verify_user',
            password='Password123!',
            is_active=False,
            email_verified=False,
        )
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = email_verification_token.make_token(user)

        response = self.client.get(f"{self.verify_url}?uid={uid}&token={token}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        user.refresh_from_db()
        self.assertTrue(user.is_active)
        self.assertTrue(user.email_verified)

    def test_06_login_after_verification_succeeds(self):
        """Login using email and password succeeds after verification."""
        user = User.objects.create_user(
            email='active@focusflow.app',
            username='active_user',
            password='Password123!',
            is_active=True,
            email_verified=True,
        )
        data = {
            'email': 'active@focusflow.app',
            'password': 'Password123!',
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertEqual(response.data['user']['email'], 'active@focusflow.app')
        self.assertEqual(response.data['user']['username'], 'active_user')

    def test_07_wrong_password_rejected(self):
        """Login with incorrect password is rejected with 401."""
        User.objects.create_user(
            email='user@focusflow.app',
            username='user',
            password='CorrectPassword123!',
            is_active=True,
            email_verified=True,
        )
        data = {
            'email': 'user@focusflow.app',
            'password': 'WrongPassword!',
        }
        response = self.client.post(self.login_url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_08_reused_or_tampered_token_rejected(self):
        """Reused or tampered verification token is rejected."""
        user = User.objects.create_user(
            email='tamper@focusflow.app',
            username='tamper_user',
            password='Password123!',
            is_active=False,
            email_verified=False,
        )
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        bad_token = 'invalid-token-here'

        response = self.client.get(f"{self.verify_url}?uid={uid}&token={bad_token}")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_09_resend_verification_email(self):
        """Resend verification sends an email for an unverified account."""
        User.objects.create_user(
            email='resend@focusflow.app',
            username='resend_user',
            password='Password123!',
            is_active=False,
            email_verified=False,
        )
        response = self.client.post(self.resend_url, {'email': 'resend@focusflow.app'}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)

    def test_10_task_and_category_models_intact(self):
        """Existing Task and Category functionality remains intact with User model."""
        user = User.objects.create_user(
            email='todo_user@focusflow.app',
            username='todo_user',
            password='Password123!',
            is_active=True,
            email_verified=True,
        )
        category = Category.objects.create(user=user, name='Work')
        task = Task.objects.create(
            user=user,
            category=category,
            title='Implement Authentication',
            priority=Task.Priority.HIGH,
        )
        self.assertEqual(task.title, 'Implement Authentication')
        self.assertEqual(task.priority, 'HIGH')
        self.assertEqual(task.category.name, 'Work')
        self.assertEqual(task.user.email, 'todo_user@focusflow.app')
        self.assertEqual(str(task), 'Implement Authentication')
        self.assertEqual(str(category), 'Work')


class TaskAndCategoryAPITests(TestCase):
    def setUp(self):
        self.client_a = APIClient()
        self.user_a = User.objects.create_user(
            email='user_a@focusflow.app',
            username='user_a',
            password='Password123!',
            is_active=True,
            email_verified=True,
        )
        login_resp_a = self.client_a.post('/api/auth/login/', {'email': 'user_a@focusflow.app', 'password': 'Password123!'}, format='json')
        self.token_a = login_resp_a.data['token']
        self.client_a.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a}')

        self.client_b = APIClient()
        self.user_b = User.objects.create_user(
            email='user_b@focusflow.app',
            username='user_b',
            password='Password123!',
            is_active=True,
            email_verified=True,
        )
        login_resp_b = self.client_b.post('/api/auth/login/', {'email': 'user_b@focusflow.app', 'password': 'Password123!'}, format='json')
        self.token_b = login_resp_b.data['token']
        self.client_b.credentials(HTTP_AUTHORIZATION=f'Token {self.token_b}')

        self.unauth_client = APIClient()

    def test_unauthenticated_requests_rejected(self):
        """Unauthenticated requests to categories and tasks endpoints are rejected with 401."""
        self.assertEqual(self.unauth_client.get('/api/categories/').status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.unauth_client.post('/api/categories/', {'name': 'Test'}).status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.unauth_client.get('/api/tasks/').status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(self.unauth_client.post('/api/tasks/', {'title': 'Test'}).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_category_crud_and_isolation(self):
        """Categories support CRUD, reject duplicate names per user, and isolate user data."""
        # 1. User A creates Category "Work"
        resp = self.client_a.post('/api/categories/', {'name': 'Work'}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        cat_a_id = resp.data['id']
        self.assertEqual(resp.data['name'], 'Work')

        # 2. Duplicate category for same user is rejected
        dup_resp = self.client_a.post('/api/categories/', {'name': 'work'}, format='json')
        self.assertEqual(dup_resp.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. User B can create category with same name "Work" without conflict
        resp_b = self.client_b.post('/api/categories/', {'name': 'Work'}, format='json')
        self.assertEqual(resp_b.status_code, status.HTTP_201_CREATED)
        cat_b_id = resp_b.data['id']
        self.assertNotEqual(cat_a_id, cat_b_id)

        # 4. User A only sees their own category
        list_a = self.client_a.get('/api/categories/')
        self.assertEqual(list_a.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_a.data), 1)
        self.assertEqual(list_a.data[0]['id'], cat_a_id)

        # 5. User A updates category name
        patch_resp = self.client_a.patch(f'/api/categories/{cat_a_id}/', {'name': 'Career'}, format='json')
        self.assertEqual(patch_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_resp.data['name'], 'Career')

        # 6. User B cannot access or modify User A's category
        self.assertEqual(self.client_b.get(f'/api/categories/{cat_a_id}/').status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client_b.patch(f'/api/categories/{cat_a_id}/', {'name': 'Hacked'}).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client_b.delete(f'/api/categories/{cat_a_id}/').status_code, status.HTTP_404_NOT_FOUND)

        # 7. User A deletes their category
        del_resp = self.client_a.delete(f'/api/categories/{cat_a_id}/')
        self.assertEqual(del_resp.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(len(self.client_a.get('/api/categories/').data), 0)

    def test_task_crud_and_isolation(self):
        """Tasks support CRUD, category linking, case-insensitive priority, and user data isolation."""
        # Setup: User A has a category, User B has a category
        cat_a = Category.objects.create(user=self.user_a, name='Learning')
        cat_b = Category.objects.create(user=self.user_b, name='Secret')

        # 1. User A creates a task with category, priority 'High', and dueDate
        task_data = {
            'title': 'Study Django',
            'description': 'Read DRF documentation',
            'category': cat_a.id,
            'priority': 'High',
            'dueDate': '2026-09-28',
        }
        resp = self.client_a.post('/api/tasks/', task_data, format='json')
        self.assertEqual(resp.status_code, status.HTTP_201_CREATED)
        task_a_id = resp.data['id']
        self.assertEqual(resp.data['title'], 'Study Django')
        self.assertEqual(resp.data['category'], cat_a.id)
        self.assertEqual(resp.data['category_name'], 'Learning')
        self.assertEqual(resp.data['priority'], 'HIGH')
        self.assertEqual(resp.data['dueDate'], '2026-09-28')
        self.assertFalse(resp.data['completed'])

        # 2. User A cannot use User B's category
        invalid_cat_data = {
            'title': 'Intrusion task',
            'category': cat_b.id,
        }
        resp_invalid = self.client_a.post('/api/tasks/', invalid_cat_data, format='json')
        self.assertEqual(resp_invalid.status_code, status.HTTP_400_BAD_REQUEST)

        # 3. User A can create task with null category
        resp_null_cat = self.client_a.post('/api/tasks/', {'title': 'Uncategorized task', 'category': None}, format='json')
        self.assertEqual(resp_null_cat.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(resp_null_cat.data['category'])

        # 4. User B creates their own task
        self.client_b.post('/api/tasks/', {'title': 'User B Task'}, format='json')

        # 5. Data isolation: User A only sees User A's tasks
        list_a = self.client_a.get('/api/tasks/')
        self.assertEqual(list_a.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_a.data), 2)
        for t in list_a.data:
            self.assertIn(t['title'], ['Study Django', 'Uncategorized task'])

        # 6. Toggle completed via PATCH
        patch_completed = self.client_a.patch(f'/api/tasks/{task_a_id}/', {'completed': True}, format='json')
        self.assertEqual(patch_completed.status_code, status.HTTP_200_OK)
        self.assertTrue(patch_completed.data['completed'])
        self.assertIsNotNone(patch_completed.data['completed_at'])

        # 7. Edit task fields (title, priority)
        patch_edit = self.client_a.patch(f'/api/tasks/{task_a_id}/', {'title': 'Study Django & DRF', 'priority': 'Medium'}, format='json')
        self.assertEqual(patch_edit.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_edit.data['title'], 'Study Django & DRF')
        self.assertEqual(patch_edit.data['priority'], 'MEDIUM')

        # 8. User B cannot access, patch, or delete User A's task
        self.assertEqual(self.client_b.get(f'/api/tasks/{task_a_id}/').status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client_b.patch(f'/api/tasks/{task_a_id}/', {'title': 'Hacked'}).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(self.client_b.delete(f'/api/tasks/{task_a_id}/').status_code, status.HTTP_404_NOT_FOUND)

        # 9. User A deletes the task
        del_task = self.client_a.delete(f'/api/tasks/{task_a_id}/')
        self.assertEqual(del_task.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.client_a.get(f'/api/tasks/{task_a_id}/').status_code, status.HTTP_404_NOT_FOUND)


class TaskActivityModelTests(TestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(
            email='user_a@focusflow.app',
            username='user_a',
            password='Password123!',
            is_active=True,
            email_verified=True,
        )
        self.user_b = User.objects.create_user(
            email='user_b@focusflow.app',
            username='user_b',
            password='Password123!',
            is_active=True,
            email_verified=True,
        )
        self.task_a = Task.objects.create(
            user=self.user_a,
            title='Task A for User A',
            priority=Task.Priority.HIGH,
        )
        self.task_b = Task.objects.create(
            user=self.user_b,
            title='Task B for User B',
            priority=Task.Priority.MEDIUM,
        )
        self.today = date(2026, 9, 28)
        self.yesterday = date(2026, 9, 27)

    def test_a_create_task_activity(self):
        """A. A TaskActivity can be created for a task and string representation matches."""
        activity = TaskActivity.objects.create(
            user=self.user_a,
            task=self.task_a,
            activity_date=self.today,
            activity_type=TaskActivity.ActivityType.COMPLETED,
        )
        self.assertEqual(activity.task, self.task_a)
        self.assertEqual(activity.activity_date, self.today)
        self.assertEqual(activity.activity_type, TaskActivity.ActivityType.COMPLETED)
        expected_str = f"user_a - Task A for User A - 2026-09-28 - COMPLETED"
        self.assertEqual(str(activity), expected_str)

    def test_b_activity_belongs_to_correct_user(self):
        """B. The activity belongs to the correct user."""
        activity = TaskActivity.objects.create(
            user=self.user_a,
            task=self.task_a,
            activity_date=self.today,
        )
        self.assertEqual(activity.user, self.user_a)
        self.assertIn(activity, self.user_a.task_activities.all())
        self.assertNotIn(activity, self.user_b.task_activities.all())

    def test_c_user_cannot_create_activity_for_another_users_task(self):
        """C. A user cannot accidentally create/use an activity belonging to another user's task."""
        with self.assertRaises(ValidationError):
            TaskActivity.objects.create(
                user=self.user_b,
                task=self.task_a,  # task_a belongs to user_a, not user_b
                activity_date=self.today,
            )

    def test_d_duplicate_completed_activity_same_date_rejected(self):
        """D. Duplicate COMPLETED activity for the same task on the same date is rejected by database constraint."""
        TaskActivity.objects.create(
            user=self.user_a,
            task=self.task_a,
            activity_date=self.today,
            activity_type=TaskActivity.ActivityType.COMPLETED,
        )
        with self.assertRaises(IntegrityError):
            TaskActivity.objects.create(
                user=self.user_a,
                task=self.task_a,
                activity_date=self.today,
                activity_type=TaskActivity.ActivityType.COMPLETED,
            )

    def test_e_same_task_can_have_completed_activity_on_different_dates(self):
        """E. The same task can have COMPLETED activity on different dates."""
        act1 = TaskActivity.objects.create(
            user=self.user_a,
            task=self.task_a,
            activity_date=self.yesterday,
            activity_type=TaskActivity.ActivityType.COMPLETED,
        )
        act2 = TaskActivity.objects.create(
            user=self.user_a,
            task=self.task_a,
            activity_date=self.today,
            activity_type=TaskActivity.ActivityType.COMPLETED,
        )
        self.assertEqual(self.task_a.activities.count(), 2)
        self.assertEqual(act1.activity_date, self.yesterday)
        self.assertEqual(act2.activity_date, self.today)

    def test_f_deleting_task_deletes_related_activities(self):
        """F. Deleting a task also deletes its related activities."""
        TaskActivity.objects.create(
            user=self.user_a,
            task=self.task_a,
            activity_date=self.today,
        )
        self.assertEqual(TaskActivity.objects.filter(task=self.task_a).count(), 1)
        self.task_a.delete()
        self.assertEqual(TaskActivity.objects.filter(task_id=self.task_a.id).count(), 0)

    def test_g_deleting_user_deletes_activities(self):
        """G. Deleting a user also deletes their activities."""
        TaskActivity.objects.create(
            user=self.user_a,
            task=self.task_a,
            activity_date=self.today,
        )
        self.assertEqual(TaskActivity.objects.filter(user=self.user_a).count(), 1)
        self.user_a.delete()
        self.assertEqual(TaskActivity.objects.filter(user_id=self.user_a.id).count(), 0)


class TaskActivityAPITests(TestCase):
    def setUp(self):
        self.client_a = APIClient()
        self.user_a = User.objects.create_user(
            email='user_a@focusflow.app',
            username='user_a',
            password='Password123!',
            is_active=True,
            email_verified=True,
        )
        login_resp_a = self.client_a.post(
            '/api/auth/login/',
            {'email': 'user_a@focusflow.app', 'password': 'Password123!'},
            format='json',
        )
        self.token_a = login_resp_a.data['token']
        self.client_a.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a}')

        self.client_b = APIClient()
        self.user_b = User.objects.create_user(
            email='user_b@focusflow.app',
            username='user_b',
            password='Password123!',
            is_active=True,
            email_verified=True,
        )
        login_resp_b = self.client_b.post(
            '/api/auth/login/',
            {'email': 'user_b@focusflow.app', 'password': 'Password123!'},
            format='json',
        )
        self.token_b = login_resp_b.data['token']
        self.client_b.credentials(HTTP_AUTHORIZATION=f'Token {self.token_b}')

        self.unauth_client = APIClient()

        self.task_a1 = Task.objects.create(
            user=self.user_a,
            title='User A Task 1',
            priority=Task.Priority.HIGH,
        )
        self.task_a2 = Task.objects.create(
            user=self.user_a,
            title='User A Task 2',
            priority=Task.Priority.MEDIUM,
        )
        self.task_b1 = Task.objects.create(
            user=self.user_b,
            title='User B Task 1',
            priority=Task.Priority.LOW,
        )
        self.url = '/api/task-activities/'

    def test_a_authenticated_user_can_retrieve_own_activities(self):
        """A. Authenticated user can retrieve their own activities."""
        act1 = TaskActivity.objects.create(
            user=self.user_a,
            task=self.task_a1,
            activity_date=date(2026, 9, 28),
        )
        act2 = TaskActivity.objects.create(
            user=self.user_a,
            task=self.task_a2,
            activity_date=date(2026, 9, 27),
        )

        response = self.client_a.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        returned_ids = [item['id'] for item in response.data]
        self.assertIn(act1.id, returned_ids)
        self.assertIn(act2.id, returned_ids)

    def test_b_user_isolation(self):
        """B. User A cannot see User B's activities and User B cannot see User A's activities."""
        act_a = TaskActivity.objects.create(
            user=self.user_a,
            task=self.task_a1,
            activity_date=date(2026, 9, 28),
        )
        act_b = TaskActivity.objects.create(
            user=self.user_b,
            task=self.task_b1,
            activity_date=date(2026, 9, 28),
        )

        # User A only sees User A's activities
        resp_a = self.client_a.get(self.url)
        self.assertEqual(resp_a.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp_a.data), 1)
        self.assertEqual(resp_a.data[0]['id'], act_a.id)

        # User B only sees User B's activities
        resp_b = self.client_b.get(self.url)
        self.assertEqual(resp_b.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp_b.data), 1)
        self.assertEqual(resp_b.data[0]['id'], act_b.id)

    def test_c_unauthenticated_request_rejected(self):
        """C. Unauthenticated request is rejected."""
        response = self.unauth_client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_d_response_contains_expected_fields(self):
        """D. Response contains the expected fields: id, task, task_title, activity_date, activity_type, created_at."""
        activity = TaskActivity.objects.create(
            user=self.user_a,
            task=self.task_a1,
            activity_date=date(2026, 9, 28),
            activity_type=TaskActivity.ActivityType.COMPLETED,
        )

        response = self.client_a.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

        item = response.data[0]
        expected_fields = {'id', 'task', 'task_title', 'activity_date', 'activity_type', 'created_at'}
        self.assertEqual(set(item.keys()), expected_fields)
        self.assertEqual(item['id'], activity.id)
        self.assertEqual(item['task'], self.task_a1.id)
        self.assertEqual(item['task_title'], self.task_a1.title)
        self.assertEqual(item['activity_date'], '2026-09-28')
        self.assertEqual(item['activity_type'], 'COMPLETED')
        self.assertIsNotNone(item['created_at'])
        self.assertNotIn('user', item)

    def test_e_activities_returned_in_newest_first_order(self):
        """E. Activities are returned in newest-first order (activity_date desc, created_at desc)."""
        act_old = TaskActivity.objects.create(
            user=self.user_a,
            task=self.task_a1,
            activity_date=date(2026, 9, 20),
        )
        act_mid = TaskActivity.objects.create(
            user=self.user_a,
            task=self.task_a1,
            activity_date=date(2026, 9, 25),
        )
        act_new_1 = TaskActivity.objects.create(
            user=self.user_a,
            task=self.task_a1,
            activity_date=date(2026, 9, 28),
        )
        act_new_2 = TaskActivity.objects.create(
            user=self.user_a,
            task=self.task_a2,
            activity_date=date(2026, 9, 28),
        )

        response = self.client_a.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        ids = [item['id'] for item in response.data]
        self.assertEqual(ids, [act_new_2.id, act_new_1.id, act_mid.id, act_old.id])

    def test_f_task_title_matches_related_task(self):
        """F. task_title correctly matches the related Task title."""
        task = Task.objects.create(
            user=self.user_a,
            title='FocusFlow Backend Implementation',
            priority=Task.Priority.HIGH,
        )
        TaskActivity.objects.create(
            user=self.user_a,
            task=task,
            activity_date=date(2026, 9, 28),
        )

        response = self.client_a.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        item = next(x for x in response.data if x['task'] == task.id)
        self.assertEqual(item['task_title'], 'FocusFlow Backend Implementation')

    def test_g_serializer_disallows_assigning_activity_to_another_users_task(self):
        """Serializer rejects assigning an activity to another user's task."""
        class MockRequest:
            def __init__(self, user):
                self.user = user

        serializer = TaskActivitySerializer(
            data={'task': self.task_b1.id, 'activity_date': '2026-09-28'},
            context={'request': MockRequest(self.user_a)},
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('task', serializer.errors)

    def test_h_user_not_exposed_or_writable_in_serializer(self):
        """Serializer does not expose or allow writing user field."""
        serializer = TaskActivitySerializer()
        self.assertNotIn('user', serializer.fields)


class TaskActivityAutoCreationTests(TestCase):
    def setUp(self):
        self.client_a = APIClient()
        self.user_a = User.objects.create_user(
            email='user_a@focusflow.app',
            username='user_a',
            password='Password123!',
            is_active=True,
            email_verified=True,
        )
        login_resp_a = self.client_a.post(
            '/api/auth/login/',
            {'email': 'user_a@focusflow.app', 'password': 'Password123!'},
            format='json',
        )
        self.token_a = login_resp_a.data['token']
        self.client_a.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a}')

        self.client_b = APIClient()
        self.user_b = User.objects.create_user(
            email='user_b@focusflow.app',
            username='user_b',
            password='Password123!',
            is_active=True,
            email_verified=True,
        )
        login_resp_b = self.client_b.post(
            '/api/auth/login/',
            {'email': 'user_b@focusflow.app', 'password': 'Password123!'},
            format='json',
        )
        self.token_b = login_resp_b.data['token']
        self.client_b.credentials(HTTP_AUTHORIZATION=f'Token {self.token_b}')

        self.category_a = Category.objects.create(user=self.user_a, name='Personal')
        self.task_a = Task.objects.create(
            user=self.user_a,
            title='Incomplete Task A',
            category=self.category_a,
            priority=Task.Priority.HIGH,
            completed=False,
        )
        self.task_b = Task.objects.create(
            user=self.user_b,
            title='Incomplete Task B',
            priority=Task.Priority.MEDIUM,
            completed=False,
        )

    def test_a_completing_task_creates_exactly_one_activity(self):
        """A. Completing an incomplete task creates exactly one TaskActivity."""
        self.assertEqual(TaskActivity.objects.filter(task=self.task_a).count(), 0)

        response = self.client_a.patch(f'/api/tasks/{self.task_a.id}/', {'completed': True}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['completed'])

        self.assertEqual(TaskActivity.objects.filter(task=self.task_a).count(), 1)

    def test_b_created_activity_attributes(self):
        """B. The created activity has correct user, correct task, today's local date, and activity_type = COMPLETED."""
        response = self.client_a.patch(f'/api/tasks/{self.task_a.id}/', {'completed': True}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        activity = TaskActivity.objects.get(task=self.task_a)
        self.assertEqual(activity.user, self.user_a)
        self.assertEqual(activity.task, self.task_a)
        self.assertEqual(activity.activity_date, timezone.localdate())
        self.assertEqual(activity.activity_type, TaskActivity.ActivityType.COMPLETED)

    def test_c_updating_already_completed_task_does_not_create_another_activity(self):
        """C. Updating an already-completed task with completed=True does NOT create another activity."""
        self.client_a.patch(f'/api/tasks/{self.task_a.id}/', {'completed': True}, format='json')
        self.assertEqual(TaskActivity.objects.filter(task=self.task_a).count(), 1)

        # Send completed=True again
        response = self.client_a.patch(f'/api/tasks/{self.task_a.id}/', {'completed': True}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(TaskActivity.objects.filter(task=self.task_a).count(), 1)

    def test_d_complete_uncomplete_recomplete_same_date_no_duplicates(self):
        """D. Completing a task, uncompleting it, then completing it again on the SAME DATE does not create duplicate activity records."""
        # 1. Complete
        self.client_a.patch(f'/api/tasks/{self.task_a.id}/', {'completed': True}, format='json')
        self.assertEqual(TaskActivity.objects.filter(task=self.task_a).count(), 1)

        # 2. Uncomplete
        resp_uncomplete = self.client_a.patch(f'/api/tasks/{self.task_a.id}/', {'completed': False}, format='json')
        self.assertEqual(resp_uncomplete.status_code, status.HTTP_200_OK)
        self.assertFalse(resp_uncomplete.data['completed'])
        # Historical activity is preserved
        self.assertEqual(TaskActivity.objects.filter(task=self.task_a).count(), 1)

        # 3. Re-complete on same date
        resp_recomplete = self.client_a.patch(f'/api/tasks/{self.task_a.id}/', {'completed': True}, format='json')
        self.assertEqual(resp_recomplete.status_code, status.HTTP_200_OK)
        self.assertTrue(resp_recomplete.data['completed'])
        # Still exactly 1 activity for this task and date
        self.assertEqual(TaskActivity.objects.filter(task=self.task_a).count(), 1)

    def test_e_updating_other_fields_while_completed_does_not_create_activity(self):
        """E. Updating title/priority/category/due_date while the task remains completed does not create another activity."""
        # Complete task first
        self.client_a.patch(f'/api/tasks/{self.task_a.id}/', {'completed': True}, format='json')
        self.assertEqual(TaskActivity.objects.filter(task=self.task_a).count(), 1)

        # Update title
        self.client_a.patch(f'/api/tasks/{self.task_a.id}/', {'title': 'New Title'}, format='json')
        self.assertEqual(TaskActivity.objects.filter(task=self.task_a).count(), 1)

        # Update priority
        self.client_a.patch(f'/api/tasks/{self.task_a.id}/', {'priority': 'LOW'}, format='json')
        self.assertEqual(TaskActivity.objects.filter(task=self.task_a).count(), 1)

        # Update due date
        self.client_a.patch(f'/api/tasks/{self.task_a.id}/', {'dueDate': '2026-10-31'}, format='json')
        self.assertEqual(TaskActivity.objects.filter(task=self.task_a).count(), 1)

        # Update category to None
        self.client_a.patch(f'/api/tasks/{self.task_a.id}/', {'category': None}, format='json')
        self.assertEqual(TaskActivity.objects.filter(task=self.task_a).count(), 1)

    def test_f_user_isolation(self):
        """F. User isolation remains intact when completing tasks and accessing activities."""
        # User B tries to complete User A's task
        resp_b = self.client_b.patch(f'/api/tasks/{self.task_a.id}/', {'completed': True}, format='json')
        self.assertEqual(resp_b.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(TaskActivity.objects.filter(task=self.task_a).count(), 0)

        # User A completes User A's task
        resp_a = self.client_a.patch(f'/api/tasks/{self.task_a.id}/', {'completed': True}, format='json')
        self.assertEqual(resp_a.status_code, status.HTTP_200_OK)

        # The activity belongs to User A
        act = TaskActivity.objects.get(task=self.task_a)
        self.assertEqual(act.user, self.user_a)

        # User B cannot see User A's activity via task activities API
        activities_b = self.client_b.get('/api/task-activities/')
        self.assertEqual(activities_b.status_code, status.HTTP_200_OK)
        self.assertEqual(len(activities_b.data), 0)

        # User A can see their activity via task activities API
        activities_a = self.client_a.get('/api/task-activities/')
        self.assertEqual(activities_a.status_code, status.HTTP_200_OK)
        self.assertEqual(len(activities_a.data), 1)
        self.assertEqual(activities_a.data[0]['id'], act.id)

    def test_g_completing_different_tasks_same_date_creates_separate_activities(self):
        """G. Completing different tasks on the same date creates separate activity records."""
        task_a2 = Task.objects.create(
            user=self.user_a,
            title='Second Task for User A',
            priority=Task.Priority.LOW,
            completed=False,
        )

        resp1 = self.client_a.patch(f'/api/tasks/{self.task_a.id}/', {'completed': True}, format='json')
        self.assertEqual(resp1.status_code, status.HTTP_200_OK)

        resp2 = self.client_a.patch(f'/api/tasks/{task_a2.id}/', {'completed': True}, format='json')
        self.assertEqual(resp2.status_code, status.HTTP_200_OK)

        acts = TaskActivity.objects.filter(user=self.user_a, activity_date=timezone.localdate())
        self.assertEqual(acts.count(), 2)
        tasks_in_activities = {a.task_id for a in acts}
        self.assertEqual(tasks_in_activities, {self.task_a.id, task_a2.id})

    def test_h_completing_same_task_different_dates_creates_separate_activities(self):
        """H. Completing the same task on different dates creates separate activity records for those dates."""
        past_date = date(2026, 9, 20)
        # Create historical activity for past date
        TaskActivity.objects.create(
            user=self.user_a,
            task=self.task_a,
            activity_date=past_date,
            activity_type=TaskActivity.ActivityType.COMPLETED,
        )

        # Complete task today via API
        resp = self.client_a.patch(f'/api/tasks/{self.task_a.id}/', {'completed': True}, format='json')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)

        # Both records exist for this same task
        activities = TaskActivity.objects.filter(task=self.task_a).order_by('activity_date')
        self.assertEqual(activities.count(), 2)
        self.assertEqual(activities[0].activity_date, past_date)
        self.assertEqual(activities[1].activity_date, timezone.localdate())

    def test_i_deleting_task_via_api_removes_activities(self):
        """I. Deleting a Task via API cascades and removes its TaskActivity records from both DB and API."""
        # 1. Complete task -> activity created
        self.client_a.patch(f'/api/tasks/{self.task_a.id}/', {'completed': True}, format='json')
        self.assertEqual(TaskActivity.objects.filter(task=self.task_a).count(), 1)

        # Verify activity appears in GET /api/task-activities/
        get_resp = self.client_a.get('/api/task-activities/')
        self.assertEqual(get_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(get_resp.data), 1)

        # 2. Delete task via API
        del_resp = self.client_a.delete(f'/api/tasks/{self.task_a.id}/')
        self.assertEqual(del_resp.status_code, status.HTTP_204_NO_CONTENT)

        # Verify task is deleted
        self.assertEqual(Task.objects.filter(id=self.task_a.id).count(), 0)

        # Verify activities for that task are deleted from DB
        self.assertEqual(TaskActivity.objects.filter(task_id=self.task_a.id).count(), 0)

        # Verify activities API no longer returns them
        get_resp_after = self.client_a.get('/api/task-activities/')
        self.assertEqual(get_resp_after.status_code, status.HTTP_200_OK)
        self.assertEqual(len(get_resp_after.data), 0)

    def test_j_deleting_user_removes_their_activities(self):
        """J. Deleting a user cascades and removes that user's TaskActivity records."""
        self.client_a.patch(f'/api/tasks/{self.task_a.id}/', {'completed': True}, format='json')
        self.assertEqual(TaskActivity.objects.filter(user=self.user_a).count(), 1)
        user_id = self.user_a.id

        self.user_a.delete()
        self.assertEqual(TaskActivity.objects.filter(user_id=user_id).count(), 0)

    def test_k_progress_related_activity_dates_ordered(self):
        """K. TaskActivity API returns activities with accurate dates ordered newest first for progress tracking."""
        d1 = date(2026, 9, 25)
        d2 = date(2026, 9, 27)
        TaskActivity.objects.create(user=self.user_a, task=self.task_a, activity_date=d1)
        TaskActivity.objects.create(user=self.user_a, task=self.task_a, activity_date=d2)

        resp = self.client_a.get('/api/task-activities/')
        self.assertEqual(resp.status_code, status.HTTP_200_OK)
        self.assertEqual(len(resp.data), 2)
        # Newest first
        self.assertEqual(resp.data[0]['activity_date'], '2026-09-27')
        self.assertEqual(resp.data[1]['activity_date'], '2026-09-25')


class HolidayEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = '/api/holidays/'

    def test_get_holidays_success(self):
        """GET /api/holidays/?year=2026 returns 200 with real normalized holiday items."""
        response = self.client.get(self.url, {'year': 2026})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['year'], 2026)
        self.assertIn('holidays', response.data)
        self.assertIsInstance(response.data['holidays'], list)
        if response.data['holidays']:
            first_h = response.data['holidays'][0]
            self.assertIn('date', first_h)
            self.assertIn('name', first_h)
            self.assertIn('type', first_h)
            self.assertTrue(first_h['date'].startswith('2026-'))

    def test_invalid_year_rejected(self):
        """GET /api/holidays/?year=abc returns 400 Bad Request."""
        response = self.client.get(self.url, {'year': 'invalid_year'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('detail', response.data)

    def test_out_of_range_year_rejected(self):
        """GET /api/holidays/?year=1850 returns 400 Bad Request."""
        response = self.client.get(self.url, {'year': 1850})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_default_year_used_when_omitted(self):
        """GET /api/holidays/ without year parameter defaults to current year."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('year', response.data)
        self.assertEqual(response.data['year'], timezone.now().year)


class ExpenseTests(TestCase):
    def setUp(self):
        self.client_a = APIClient()
        self.client_b = APIClient()
        self.unauth_client = APIClient()

        self.user_a = User.objects.create_user(
            email='user_a@focusflow.app',
            username='user_a',
            password='Password123!',
            is_active=True,
            email_verified=True,
        )
        self.token_a = Token.objects.create(user=self.user_a)
        self.client_a.credentials(HTTP_AUTHORIZATION=f'Token {self.token_a.key}')

        self.user_b = User.objects.create_user(
            email='user_b@focusflow.app',
            username='user_b',
            password='Password123!',
            is_active=True,
            email_verified=True,
        )
        self.token_b = Token.objects.create(user=self.user_b)
        self.client_b.credentials(HTTP_AUTHORIZATION=f'Token {self.token_b.key}')

        self.url = '/api/expenses/'

    def test_01_authenticated_user_can_create_expense(self):
        """1. Authenticated user can create expense."""
        data = {
            'description': 'Lunch at Bistro',
            'amount': '150.00',
            'expense_date': '2026-10-05',
        }
        res = self.client_a.post(self.url, data, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['description'], 'Lunch at Bistro')
        self.assertEqual(res.data['amount'], '150.00')
        self.assertEqual(res.data['expense_date'], '2026-10-05')
        self.assertTrue(Expense.objects.filter(user=self.user_a, description='Lunch at Bistro').exists())

    def test_02_authenticated_user_can_list_own_expenses(self):
        """2. Authenticated user can list own expenses."""
        Expense.objects.create(user=self.user_a, description='Tea', amount=20.00, expense_date=date(2026, 10, 4))
        Expense.objects.create(user=self.user_a, description='Bus', amount=40.00, expense_date=date(2026, 10, 5))

        res = self.client_a.get(self.url, {'year': 2026, 'month': 10})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)
        # Verify ordering: expense_date desc
        self.assertEqual(res.data[0]['description'], 'Bus')
        self.assertEqual(res.data[1]['description'], 'Tea')

    def test_03_user_cannot_see_another_users_expenses(self):
        """3. User cannot see another user's expenses."""
        exp_a = Expense.objects.create(user=self.user_a, description='Secret A', amount=100.00, expense_date=date(2026, 10, 5))
        exp_b = Expense.objects.create(user=self.user_b, description='Secret B', amount=200.00, expense_date=date(2026, 10, 5))

        # User A list only sees own
        res_a = self.client_a.get(self.url, {'year': 2026, 'month': 10})
        self.assertEqual(len(res_a.data), 1)
        self.assertEqual(res_a.data[0]['description'], 'Secret A')

        # User B cannot access User A's expense detail
        res_b_detail = self.client_b.get(f'/api/expenses/{exp_a.id}/')
        self.assertEqual(res_b_detail.status_code, status.HTTP_404_NOT_FOUND)

    def test_04_user_cannot_edit_another_users_expense(self):
        """4. User cannot edit another user's expense."""
        exp_a = Expense.objects.create(user=self.user_a, description='Original', amount=100.00, expense_date=date(2026, 10, 5))
        res = self.client_b.patch(f'/api/expenses/{exp_a.id}/', {'amount': '999.00'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        exp_a.refresh_from_db()
        self.assertEqual(exp_a.amount, 100.00)

    def test_05_user_cannot_delete_another_users_expense(self):
        """5. User cannot delete another user's expense."""
        exp_a = Expense.objects.create(user=self.user_a, description='Original', amount=100.00, expense_date=date(2026, 10, 5))
        res = self.client_b.delete(f'/api/expenses/{exp_a.id}/')
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Expense.objects.filter(id=exp_a.id).exists())

    def test_06_expense_amount_is_validated(self):
        """6. Expense amount is validated (>0, non-negative, valid number)."""
        # Zero amount rejected
        res = self.client_a.post(self.url, {'description': 'Item', 'amount': '0.00', 'expense_date': '2026-10-05'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # Negative amount rejected
        res = self.client_a.post(self.url, {'description': 'Item', 'amount': '-50.00', 'expense_date': '2026-10-05'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # Missing amount rejected
        res = self.client_a.post(self.url, {'description': 'Item', 'expense_date': '2026-10-05'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        # Blank description rejected
        res = self.client_a.post(self.url, {'description': '   ', 'amount': '50.00', 'expense_date': '2026-10-05'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_07_month_filtering_works(self):
        """7. Month filtering works and isolates records to the requested month."""
        # Oct 2026
        Expense.objects.create(user=self.user_a, description='Oct Item', amount=100.00, expense_date=date(2026, 10, 15))
        # Sep 2026
        Expense.objects.create(user=self.user_a, description='Sep Item', amount=200.00, expense_date=date(2026, 9, 20))
        # Oct 2025
        Expense.objects.create(user=self.user_a, description='Oct 2025 Item', amount=300.00, expense_date=date(2025, 10, 15))

        res_oct_2026 = self.client_a.get(self.url, {'year': 2026, 'month': 10})
        self.assertEqual(res_oct_2026.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_oct_2026.data), 1)
        self.assertEqual(res_oct_2026.data[0]['description'], 'Oct Item')

        res_sep_2026 = self.client_a.get(self.url, {'year': 2026, 'month': 9})
        self.assertEqual(len(res_sep_2026.data), 1)
        self.assertEqual(res_sep_2026.data[0]['description'], 'Sep Item')

    def test_08_edit_correctly_changes_expense(self):
        """8. Edit correctly changes expense."""
        exp = Expense.objects.create(user=self.user_a, description='Lunch', amount=150.00, expense_date=date(2026, 10, 5))
        res = self.client_a.patch(f'/api/expenses/{exp.id}/', {'amount': '180.00', 'description': 'Grand Lunch'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['amount'], '180.00')
        self.assertEqual(res.data['description'], 'Grand Lunch')

        exp.refresh_from_db()
        self.assertEqual(exp.amount, 180.00)
        self.assertEqual(exp.description, 'Grand Lunch')

    def test_09_delete_correctly_removes_expense(self):
        """9. Delete correctly removes expense."""
        exp = Expense.objects.create(user=self.user_a, description='Delete me', amount=50.00, expense_date=date(2026, 10, 5))
        res = self.client_a.delete(f'/api/expenses/{exp.id}/')
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Expense.objects.filter(id=exp.id).exists())

    def test_10_correct_monthly_records_are_returned_by_default(self):
        """10. Omitting month/year defaults to current month."""
        today = timezone.localdate()
        Expense.objects.create(user=self.user_a, description='Today Expense', amount=75.00, expense_date=today)
        res = self.client_a.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(any(e['description'] == 'Today Expense' for e in res.data))

    def test_11_unauthenticated_requests_are_rejected(self):
        """11. Unauthenticated requests are rejected."""
        res_get = self.unauth_client.get(self.url)
        self.assertEqual(res_get.status_code, status.HTTP_401_UNAUTHORIZED)

        res_post = self.unauth_client.post(self.url, {'description': 'No auth', 'amount': '10.00', 'expense_date': '2026-10-05'})
        self.assertEqual(res_post.status_code, status.HTTP_401_UNAUTHORIZED)

        res_detail = self.unauth_client.get('/api/expenses/1/')
        self.assertEqual(res_detail.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_12_expense_history_summary_calculated_from_records(self):
        """12. Monthly expense history calculates total directly from actual expense records and isolates by user."""
        # User A expenses
        Expense.objects.create(user=self.user_a, description='Oct 1', amount=1000.00, expense_date=date(2026, 10, 1))
        Expense.objects.create(user=self.user_a, description='Oct 2', amount=500.00, expense_date=date(2026, 10, 2))
        Expense.objects.create(user=self.user_a, description='Sep 1', amount=300.00, expense_date=date(2026, 9, 15))

        # User B expense
        Expense.objects.create(user=self.user_b, description='User B Item', amount=9999.00, expense_date=date(2026, 10, 5))

        res = self.client_a.get('/api/expenses/history/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

        # October 2026: 2 expenses, 1500.00
        self.assertEqual(res.data[0]['year'], 2026)
        self.assertEqual(res.data[0]['month'], 10)
        self.assertEqual(res.data[0]['count'], 2)
        self.assertEqual(res.data[0]['total_amount'], '1500.00')

        # September 2026: 1 expense, 300.00
        self.assertEqual(res.data[1]['year'], 2026)
        self.assertEqual(res.data[1]['month'], 9)
        self.assertEqual(res.data[1]['count'], 1)
        self.assertEqual(res.data[1]['total_amount'], '300.00')



