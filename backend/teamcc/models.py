from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver
import hashlib
import os

class Department(models.Model):
    dept_name = models.CharField(max_length=50, unique=True)
    desc = models.TextField(blank=True, default='')

    def __str__(self):
        return self.dept_name


class UserProfile(models.Model):
    GENDER_CHOICES = (
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
        ('Others', 'Others'),
    )

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    name = models.CharField(max_length=100, blank=True, default='')
    contact = models.CharField(max_length=15, blank=True, default='')
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, default='Male')
    year = models.CharField(max_length=20, default='1st Year')
    semester = models.CharField(max_length=20, default='1st Semester')
    class_roll = models.CharField(max_length=30, blank=True, default='')
    university_roll = models.CharField(max_length=30, blank=True, default='')
    avatar = models.TextField(blank=True, default='')
    bio = models.TextField(blank=True, default='')
    github = models.URLField(blank=True, default='')
    linkedin = models.URLField(blank=True, default='')

    def __str__(self):
        return f"{self.name} ({self.user.username})"


class MembershipCard(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='membership_card', null=True, blank=True)
    department = models.ForeignKey(Department, related_name='memberships', on_delete=models.CASCADE)
    member_id = models.CharField(max_length=30, unique=True) # e.g. CC26-CC-xxx
    role = models.CharField(max_length=50, default='Member') # e.g. Core Lead, Active Member
    category = models.CharField(max_length=20, default='Member') # 'Core' or 'Member'
    badge = models.CharField(max_length=50, default='Active Member')
    joined_date = models.DateField(default=timezone.now)
    expiry_date = models.DateField()
    qr_hash = models.CharField(max_length=64, blank=True, default='')

    def save(self, *args, **kwargs):
        if not self.qr_hash:
            raw_string = f"{self.member_id}-{self.joined_date}-{self.expiry_date}"
            self.qr_hash = hashlib.sha256(raw_string.encode('utf-8')).hexdigest()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.member_id} - {self.role}"


class Project(models.Model):
    STATUS_CHOICES = (
        ('Planning', 'Planning'),
        ('In Progress', 'In Progress'),
        ('Active', 'Active'),
        ('Completed', 'Completed'),
    )

    code = models.CharField(max_length=20, unique=True) # e.g. PR-111
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.CharField(max_length=100) # e.g. Robotics / AI
    lead_name = models.CharField(max_length=100, default='Team Lead')
    progress = models.IntegerField(default=0) # 0 to 100
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='In Progress')
    deadline = models.DateField(null=True, blank=True)
    members_count = models.IntegerField(default=1)
    assigned_members = models.TextField(blank=True, default='') # JSON list of assigned members
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.code}] {self.title}"


class ProjectResource(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='resources')
    file = models.FileField(upload_to='project_resources/%Y/%m/', null=True, blank=True)
    url = models.URLField(max_length=1000, blank=True, default='') # External URL / Web link
    title = models.CharField(max_length=255, blank=True, default='')
    file_type = models.CharField(max_length=50, blank=True, default='other') # url, github, figma, drive, youtube, notion, deployment, pdf, image, audio, video, ppt, doc, zip, code, other
    file_size = models.BigIntegerField(default=0) # in bytes (0 for external URLs)
    uploaded_by = models.CharField(max_length=150, blank=True, default='Team Member')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if self.url and not self.file:
            if not self.title:
                self.title = self.url
            if not self.file_type or self.file_type in ['other', 'url', 'link']:
                u = self.url.lower()
                if 'github.com' in u:
                    self.file_type = 'github'
                elif 'figma.com' in u:
                    self.file_type = 'figma'
                elif 'drive.google.com' in u or 'docs.google.com' in u:
                    self.file_type = 'drive'
                elif 'youtube.com' in u or 'youtu.be' in u:
                    self.file_type = 'youtube'
                elif 'notion.so' in u or 'notion.site' in u:
                    self.file_type = 'notion'
                elif any(d in u for d in ['vercel.app', 'netlify.app', 'pages.dev', 'render.com', 'herokuapp.com']):
                    self.file_type = 'deployment'
                else:
                    self.file_type = 'url'
        elif self.file:
            if not self.title:
                self.title = os.path.basename(self.file.name)
            try:
                self.file_size = self.file.size
            except Exception:
                pass
            if not self.file_type or self.file_type == 'other':
                ext = os.path.splitext(self.file.name)[1].lower().replace('.', '')
                if ext in ['pdf']:
                    self.file_type = 'pdf'
                elif ext in ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp']:
                    self.file_type = 'image'
                elif ext in ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac']:
                    self.file_type = 'audio'
                elif ext in ['mp4', 'webm', 'mkv', 'mov', 'avi']:
                    self.file_type = 'video'
                elif ext in ['ppt', 'pptx', 'key', 'odp']:
                    self.file_type = 'ppt'
                elif ext in ['doc', 'docx', 'txt', 'rtf', 'odt', 'csv', 'xlsx', 'xls']:
                    self.file_type = 'doc'
                elif ext in ['zip', 'rar', 'tar', 'gz', '7z']:
                    self.file_type = 'zip'
                elif ext in ['js', 'jsx', 'ts', 'tsx', 'py', 'html', 'css', 'json', 'cpp', 'c', 'java', 'sql', 'md']:
                    self.file_type = 'code'
                else:
                    self.file_type = ext or 'other'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"[{self.project.code}] {self.title} ({self.file_type})"


class Attendance(models.Model):
    ATT_CHOICES = (
        ('Present', 'Present'),
        ('Late', 'Late'),
        ('Excused', 'Excused'),
        ('Absent', 'Absent'),
    )
    STATUS_CHOICES = (
        ('Approved', 'Approved'),
        ('Pending', 'Pending'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='attendance_records')
    login_time = models.DateTimeField(default=timezone.now)
    logout_time = models.DateTimeField(null=True, blank=True)
    att_types = models.CharField(choices=ATT_CHOICES, max_length=15, default='Present')
    status = models.CharField(choices=STATUS_CHOICES, max_length=15, default='Approved')

    def __str__(self):
        return f"{self.user.username} - {self.att_types} ({self.login_time.strftime('%Y-%m-%d %H:%M')})"


class NoticeSheet(models.Model):
    CATEGORY_CHOICES = (
        ('Announcement', 'Announcement'),
        ('Event', 'Event'),
        ('Rules & Regulations', 'Rules & Regulations'),
        ('Mentioned Member only', 'Mentioned Member only'),
    )

    PRIORITY_CHOICES = (
        ('General', 'General'),
        ('Medium', 'Medium'),
        ('High', 'High'),
        ('Urgent', 'Urgent'),
        ('Critical', 'Critical'),
        ('Low', 'Low'),
    )

    title = models.CharField(max_length=200)
    content = models.TextField()
    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Announcement')
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='General')
    target_audience = models.TextField(blank=True, default='All Members')
    mentioned_members = models.TextField(blank=True, default='')
    author = models.CharField(max_length=100, blank=True, default='Lead Administrator')
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"[{self.category}] [{self.priority}] {self.title}"


class RoleAuditLog(models.Model):
    target_user = models.CharField(max_length=100)
    action = models.CharField(max_length=20) # PROMOTION / DEMOTION
    from_role = models.CharField(max_length=50)
    to_role = models.CharField(max_length=50)
    performed_by = models.CharField(max_length=100, default='ltAdmin@teamcc')
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.action}: {self.target_user} -> {self.to_role}"


class PasswordResetOTP(models.Model):
    email = models.EmailField()
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(default=timezone.now)
    is_used = models.BooleanField(default=False)

    def is_valid(self):
        # Valid for 10 minutes (600 seconds)
        diff = (timezone.now() - self.created_at).total_seconds()
        return not self.is_used and diff <= 600

    def __str__(self):
        return f"{self.email} - {self.otp} ({'Used' if self.is_used else 'Active'})"


class MobileLoginOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mobile_otps')
    phone = models.CharField(max_length=15)
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(default=timezone.now)
    is_used = models.BooleanField(default=False)
    attempts = models.IntegerField(default=0)

    def is_valid(self):
        # Valid for 5 minutes (300 seconds) and max 3 failed attempts
        diff = (timezone.now() - self.created_at).total_seconds()
        return not self.is_used and diff <= 300 and self.attempts < 3

    def __str__(self):
        return f"{self.phone} - {self.otp} ({'Used' if self.is_used else 'Active'}, {self.attempts} attempts)"


class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notice = models.ForeignKey(NoticeSheet, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    type = models.CharField(max_length=20, default='notice') # 'notice' or 'project'
    title = models.CharField(max_length=255, blank=True, default='')
    message = models.TextField(blank=True, default='')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        item_title = self.notice.title if self.notice else (self.project.title if self.project else self.title)
        return f"Notif for {self.user.username} | {self.type.upper()}: {item_title} | {'Read' if self.is_read else 'Unread'}"


@receiver(post_save, sender=NoticeSheet)
def create_notifications_and_dispatch_email(sender, instance, created, **kwargs):
    """
    Automatically create a Notification record for registered members and dispatch
    rich HTML notice circular emails to their email IDs when a new notice is posted.
    """
    if created:
        # Create In-App Notifications
        if instance.category == 'Mentioned Member only' and instance.mentioned_members:
            from .email_service import get_notice_recipients
            target_users = get_notice_recipients(instance)
            if not target_users:
                target_users = list(User.objects.all())
        else:
            target_users = list(User.objects.all())

        notifications = [
            Notification(
                user=u,
                notice=instance,
                type='notice',
                title=instance.title,
                message=instance.content[:200]
            )
            for u in target_users
        ]
        Notification.objects.bulk_create(notifications, ignore_conflicts=True)

        # Dispatch Asynchronous Email to Registered Members
        try:
            from .email_service import dispatch_notice_email_async
            dispatch_notice_email_async(instance.id)
        except Exception as e:
            pass


@receiver(post_save, sender=Project)
def create_project_notifications_and_dispatch_email(sender, instance, created, **kwargs):
    """
    Automatically create a Notification record for assigned team members and dispatch
    rich HTML project assignment emails when a new project is created/assigned by a project lead.
    """
    if created:
        from .email_service import get_project_recipients, dispatch_project_email_async, is_member_assigned_to_project
        target_users = get_project_recipients(instance)
        if not target_users:
            target_users = list(User.objects.filter(is_active=True))

        notifications = []
        for u in target_users:
            is_assigned = is_member_assigned_to_project(instance, u)
            if is_assigned:
                notif_title = f"[Project Assignment] [{instance.code}] {instance.title}"
                notif_msg = f"You are assigned to the core team by Project Lead {instance.lead_name}. Domain: {instance.category}."
            else:
                notif_title = f"[New Project] [{instance.code}] {instance.title}"
                notif_msg = f"New project launched by {instance.lead_name}. You have the opportunity to contribute!"

            notifications.append(
                Notification(
                    user=u,
                    project=instance,
                    type='project',
                    title=notif_title,
                    message=notif_msg
                )
            )

        Notification.objects.bulk_create(notifications, ignore_conflicts=True)

        try:
            dispatch_project_email_async(instance.id)
        except Exception as e:
            pass