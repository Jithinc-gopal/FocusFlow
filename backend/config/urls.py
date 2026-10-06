from django.contrib import admin
from django.urls import include, path
from tasks.views import (
    CategoryDetailView,
    CategoryListCreateView,
    ExpenseDetailView,
    ExpenseHistoryView,
    ExpenseListCreateView,
    HolidayListView,
    TaskActivityListView,
    TaskDetailView,
    TaskListCreateView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('tasks.urls')),
    path('api/tasks/', TaskListCreateView.as_view(), name='task-list-create'),
    path('api/tasks', TaskListCreateView.as_view()),
    path('api/tasks/<int:pk>/', TaskDetailView.as_view(), name='task-detail'),
    path('api/tasks/<int:pk>', TaskDetailView.as_view()),
    path('api/categories/', CategoryListCreateView.as_view(), name='category-list-create'),
    path('api/categories', CategoryListCreateView.as_view()),
    path('api/categories/<int:pk>/', CategoryDetailView.as_view(), name='category-detail'),
    path('api/categories/<int:pk>', CategoryDetailView.as_view()),
    path('api/task-activities/', TaskActivityListView.as_view(), name='task-activity-list'),
    path('api/task-activities', TaskActivityListView.as_view()),
    path('api/holidays/', HolidayListView.as_view(), name='holiday-list'),
    path('api/holidays', HolidayListView.as_view()),
    path('api/expenses/', ExpenseListCreateView.as_view(), name='expense-list-create'),
    path('api/expenses', ExpenseListCreateView.as_view()),
    path('api/expenses/history/', ExpenseHistoryView.as_view(), name='expense-history'),
    path('api/expenses/history', ExpenseHistoryView.as_view()),
    path('api/expenses/<int:pk>/', ExpenseDetailView.as_view(), name='expense-detail'),
    path('api/expenses/<int:pk>', ExpenseDetailView.as_view()),
]


