from django.contrib import admin
from .models import Department, MembershipCard, UserProfile, Attendance, RoleAuditLog, Project, NoticeSheet, PasswordResetOTP, MobileLoginOTP

admin.site.register(Department)
admin.site.register(MembershipCard)
admin.site.register(UserProfile)
admin.site.register(Attendance)
admin.site.register(RoleAuditLog)
admin.site.register(Project)
admin.site.register(NoticeSheet)
admin.site.register(PasswordResetOTP)
admin.site.register(MobileLoginOTP)