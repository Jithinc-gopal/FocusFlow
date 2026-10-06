from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'email_verified']
        read_only_fields = ['id', 'username', 'email', 'email_verified']


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True, min_length=6)

    def validate_email(self, value):
        normalized = value.strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError('A user with this email address already exists.')
        return normalized

    def validate_username(self, value):
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError('Username cannot be blank.')
        if User.objects.filter(username__iexact=trimmed).exists():
            raise serializers.ValidationError('A user with this username already exists.')
        return trimmed

    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password'],
            is_active=False,
            email_verified=False,
        )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(write_only=True, required=True)

    def validate_email(self, value):
        return value.strip().lower()


class ResendVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)

    def validate_email(self, value):
        return value.strip().lower()


from .models import Category, Expense, Task, TaskActivity


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_name(self, value):
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError('Category name cannot be blank.')
        return trimmed


class TaskSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, allow_null=True)

    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description',
            'category',
            'category_name',
            'priority',
            'due_date',
            'completed',
            'created_at',
            'updated_at',
            'completed_at',
        ]
        read_only_fields = [
            'id',
            'category_name',
            'created_at',
            'updated_at',
            'completed_at',
        ]

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)

        # Allow frontend to send 'dueDate' as alias for 'due_date'
        if 'dueDate' in mutable_data and 'due_date' not in mutable_data:
            mutable_data['due_date'] = mutable_data['dueDate']

        # Empty string due_date maps to None
        if mutable_data.get('due_date') == '':
            mutable_data['due_date'] = None

        # Accept priority case-insensitively (e.g., 'High' -> 'HIGH')
        if 'priority' in mutable_data and isinstance(mutable_data['priority'], str):
            val = mutable_data['priority'].strip().upper()
            if val in Task.Priority.values:
                mutable_data['priority'] = val

        # Empty string category maps to None
        if mutable_data.get('category') == '':
            mutable_data['category'] = None

        return super().to_internal_value(mutable_data)

    def validate_title(self, value):
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError('Title cannot be blank.')
        return trimmed

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        # Add frontend-compatible camelCase aliases
        if instance.due_date:
            ret['dueDate'] = instance.due_date.strftime('%Y-%m-%d')
        else:
            ret['dueDate'] = None
        ret['completedAt'] = ret.get('completed_at')
        ret['createdAt'] = ret.get('created_at')
        ret['updatedAt'] = ret.get('updated_at')
        return ret


class TaskActivitySerializer(serializers.ModelSerializer):
    task_title = serializers.CharField(source='task.title', read_only=True)

    class Meta:
        model = TaskActivity
        fields = [
            'id',
            'task',
            'task_title',
            'activity_date',
            'activity_type',
            'created_at',
        ]
        read_only_fields = [
            'id',
            'task_title',
            'created_at',
        ]

    def validate_task(self, value):
        request = self.context.get('request')
        user = getattr(request, 'user', None) if request else None
        if user and user.is_authenticated and value.user_id != user.id:
            raise serializers.ValidationError("Task does not belong to this user.")
        return value


class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = [
            'id',
            'description',
            'amount',
            'expense_date',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def to_internal_value(self, data):
        mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
        if 'expenseDate' in mutable_data and 'expense_date' not in mutable_data:
            mutable_data['expense_date'] = mutable_data['expenseDate']
        return super().to_internal_value(mutable_data)

    def validate_description(self, value):
        trimmed = value.strip()
        if not trimmed:
            raise serializers.ValidationError('Description cannot be blank.')
        return trimmed

    def validate_amount(self, value):
        if value is None:
            raise serializers.ValidationError('Amount is required.')
        if value <= 0:
            raise serializers.ValidationError('Amount must be greater than 0.')
        return value

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.amount is not None:
            ret['amount'] = f"{instance.amount:.2f}"
        ret['expenseDate'] = ret.get('expense_date')
        ret['createdAt'] = ret.get('created_at')
        ret['updatedAt'] = ret.get('updated_at')
        return ret


