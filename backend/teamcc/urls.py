from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('auth/register/', views.register_user, name='register_user'),
    path('auth/token/', views.login_token, name='login_token'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/forgot-password/request-otp/', views.request_password_reset_otp, name='request_password_reset_otp'),
    path('auth/forgot-password/validate-otp/', views.validate_password_reset_otp, name='validate_password_reset_otp'),
    path('auth/forgot-password/verify-otp/', views.verify_otp_and_reset_password, name='verify_otp_and_reset_password'),
    path('auth/phone-login/request-otp/', views.request_mobile_login_otp, name='request_mobile_login_otp'),
    path('auth/phone-login/verify-otp/', views.verify_mobile_login_otp, name='verify_mobile_login_otp'),

    # Members & Departments
    path('members/', views.get_memberships, name='get_memberships'),
    path('members/profile/', views.get_user_profile, name='get_user_profile'),
    path('dept/', views.get_departments, name='get_departments'),

    # Projects (PR-xxx) & Resources
    path('projects/', views.projects_list, name='projects_list'),
    path('projects/user/', views.user_projects, name='user_projects'),
    path('projects/<int:pk>/manage/', views.project_detail_manage, name='project_detail_manage'),
    path('projects/<int:pk>/', views.project_detail_manage, name='project_detail'),
    path('projects/<int:project_id>/resources/', views.project_resources, name='project_resources'),
    path('projects/<int:project_id>/contribute/', views.contribute_project, name='contribute_project'),
    path('projects/resources/<int:pk>/', views.delete_project_resource, name='delete_project_resource'),

    # Attendance & Notices
    path('attendance/logs/', views.attendance_logs, name='attendance_logs'),
    path('attendance/bulk/', views.bulk_record_attendance, name='bulk_record_attendance'),
    path('attendance/logs/<int:pk>/approve/', views.approve_attendance, name='approve_attendance'),
    path('attendance/logs/<int:pk>/logout/', views.session_logout_by_id, name='session_logout_by_id'),
    path('attendance/session/logout/', views.session_logout_attendance, name='session_logout_attendance'),
    path('attendance/notices/', views.notice_sheets, name='notice_sheets'),

    # Admin Governance & SM/SS
    path('admin/status/', views.admin_system_status, name='admin_system_status'),
    path('admin/promotion/', views.promote_member, name='promote_member'),
    path('admin/audit-logs/', views.role_audit_logs, name='role_audit_logs'),

    # Notifications
    path('notifications/', views.user_notifications, name='user_notifications'),
    path('notifications/<int:pk>/read/', views.mark_notification_read, name='mark_notification_read'),
    path('notifications/read-all/', views.mark_all_notifications_read, name='mark_all_notifications_read'),
]
