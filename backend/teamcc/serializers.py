from rest_framework import serializers
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
import random
from .models import (
    Department, 
    UserProfile, 
    MembershipCard, 
    Project, 
    ProjectResource,
    Attendance, 
    NoticeSheet, 
    RoleAuditLog,
    Notification
)

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = '__all__'


class MembershipCardSerializer(serializers.ModelSerializer):
    department = DepartmentSerializer(read_only=True)
    name = serializers.CharField(source='user.profile.name', read_only=True)
    avatar = serializers.CharField(source='user.profile.avatar', read_only=True)
    bio = serializers.CharField(source='user.profile.bio', read_only=True)
    year = serializers.CharField(source='user.profile.year', read_only=True)
    sem = serializers.CharField(source='user.profile.semester', read_only=True)
    classRoll = serializers.CharField(source='user.profile.class_roll', read_only=True)
    univRoll = serializers.CharField(source='user.profile.university_roll', read_only=True)
    contact = serializers.CharField(source='user.profile.contact', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    github = serializers.URLField(source='user.profile.github', read_only=True)
    linkedin = serializers.URLField(source='user.profile.linkedin', read_only=True)

    class Meta:
        model = MembershipCard
        fields = '__all__'


class RegistrationSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    email = serializers.EmailField()
    contact = serializers.CharField(max_length=15)
    gender = serializers.CharField(max_length=10, default='Male')
    department = serializers.CharField(max_length=50)
    year = serializers.CharField(max_length=20, default='1st Year')
    sem = serializers.CharField(max_length=20, default='1st Semester')
    class_roll = serializers.CharField(max_length=30)
    university_roll = serializers.CharField(max_length=30)
    avatar = serializers.CharField(required=False, allow_blank=True, default='')
    password = serializers.CharField(write_only=True, min_length=6)
    confirm_password = serializers.CharField(write_only=True, min_length=6)

    def validate(self, data):
        contact = data.get('contact', '').strip()
        univ_roll = data.get('university_roll', '').strip()

        if not contact.isdigit() or len(contact) != 10:
            raise serializers.ValidationError({"contact": "Contact number must be a valid 10-digit number."})

        if not univ_roll.isdigit():
            raise serializers.ValidationError({"university_roll": "University roll number must contain numbers only."})

        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "A user with this email address already exists."})
        return data

    def create(self, validated_data):
        # 1. Create Django User
        email = validated_data['email']
        password = validated_data['password']
        name = validated_data['name']

        username = email
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=name
        )

        # 2. Get or create Department
        dept_name = validated_data.get('department', 'dev')
        dept_obj, _ = Department.objects.get_or_create(
            dept_name=dept_name,
            defaults={'desc': f'{dept_name} Department'}
        )

        # 3. Create UserProfile
        avatar_val = validated_data.get('avatar') or f"https://api.dicebear.com/7.x/bottts/svg?seed={validated_data.get('class_roll', name)}"
        profile = UserProfile.objects.create(
            user=user,
            name=name,
            contact=validated_data.get('contact', ''),
            gender=validated_data.get('gender', 'Male'),
            year=validated_data.get('year', '1st Year'),
            semester=validated_data.get('sem', '1st Semester'),
            class_roll=validated_data.get('class_roll', ''),
            university_roll=validated_data.get('university_roll', ''),
            avatar=avatar_val,
        )

        # 4. Generate Unique 1-Year Membership ID: CC26-DEPT-XXX
        year_prefix = 'CC26'
        dept_code = dept_name.upper()
        rand_suffix = random.randint(100, 999)
        generated_member_id = f"{year_prefix}-{dept_code}-{rand_suffix}"

        # Ensure uniqueness
        while MembershipCard.objects.filter(member_id=generated_member_id).exists():
            rand_suffix = random.randint(100, 999)
            generated_member_id = f"{year_prefix}-{dept_code}-{rand_suffix}"

        joined = timezone.now().date()
        expiry = joined + timedelta(days=365)

        card = MembershipCard.objects.create(
            user=user,
            department=dept_obj,
            member_id=generated_member_id,
            role='Active Member',
            category='Member',
            badge='Active Member',
            joined_date=joined,
            expiry_date=expiry
        )

        return {
            'user': {
                'id': user.id,
                'username': user.username,
                'name': name,
                'email': email,
                'role': card.role,
                'department': dept_name,
                'year': profile.year,
                'sem': profile.semester,
                'classRoll': profile.class_roll,
                'univRoll': profile.university_roll,
                'contact': profile.contact,
                'avatar': profile.avatar,
                'joinedDate': str(joined),
                'expiryDate': str(expiry),
                'membershipId': generated_member_id
            },
            'membership_id': generated_member_id
        }


class ProjectResourceSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    file_size_formatted = serializers.SerializerMethodField()
    uploaded_at_formatted = serializers.SerializerMethodField()

    class Meta:
        model = ProjectResource
        fields = [
            'id',
            'project',
            'file',
            'url',
            'file_url',
            'title',
            'file_type',
            'file_size',
            'file_size_formatted',
            'uploaded_by',
            'uploaded_at',
            'uploaded_at_formatted'
        ]

    def get_file_url(self, obj):
        if obj.url:
            return obj.url
        if obj.file:
            return obj.file.url
        return ''

    def get_file_size_formatted(self, obj):
        if obj.url and not obj.file:
            return 'External Link'
        size = obj.file_size or 0
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{size / 1024:.1f} KB"
        elif size < 1024 * 1024 * 1024:
            return f"{size / (1024 * 1024):.1f} MB"
        else:
            return f"{size / (1024 * 1024 * 1024):.1f} GB"

    def get_uploaded_at_formatted(self, obj):
        if obj.uploaded_at:
            return obj.uploaded_at.strftime('%b %d, %Y %I:%M %p')
        return ''


class ProjectSerializer(serializers.ModelSerializer):
    resources = ProjectResourceSerializer(many=True, read_only=True)
    resources_count = serializers.IntegerField(source='resources.count', read_only=True)

    class Meta:
        model = Project
        fields = '__all__'


class AttendanceSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='user.profile.name', read_only=True)
    memberId = serializers.CharField(source='user.membership_card.member_id', read_only=True)
    dept = serializers.CharField(source='user.membership_card.department.dept_name', read_only=True)
    role = serializers.CharField(source='user.membership_card.role', read_only=True)
    avatar = serializers.CharField(source='user.profile.avatar', read_only=True)
    time = serializers.SerializerMethodField()
    date = serializers.SerializerMethodField()

    class Meta:
        model = Attendance
        fields = '__all__'

    def get_time(self, obj):
        return obj.login_time.strftime('%I:%M:%S %p') if obj.login_time else ''

    def get_date(self, obj):
        return obj.login_time.strftime('%Y-%m-%d') if obj.login_time else ''


class NoticeSheetSerializer(serializers.ModelSerializer):
    date = serializers.SerializerMethodField()

    class Meta:
        model = NoticeSheet
        fields = '__all__'

    def get_date(self, obj):
        return obj.created_at.strftime('%b %d, %Y')


class RoleAuditLogSerializer(serializers.ModelSerializer):
    time = serializers.SerializerMethodField()

    class Meta:
        model = RoleAuditLog
        fields = '__all__'

    def get_time(self, obj):
        return obj.created_at.strftime('%b %d, %Y')


class NotificationSerializer(serializers.ModelSerializer):
    notice_title = serializers.SerializerMethodField()
    notice_category = serializers.SerializerMethodField()
    notice_priority = serializers.SerializerMethodField()
    notice_date = serializers.SerializerMethodField()
    project_code = serializers.CharField(source='project.code', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    project_lead = serializers.CharField(source='project.lead_name', read_only=True)
    project_category = serializers.CharField(source='project.category', read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'is_read', 'created_at', 'type', 'title', 'message',
            'notice', 'notice_title', 'notice_category', 'notice_priority', 'notice_date',
            'project', 'project_code', 'project_title', 'project_lead', 'project_category'
        ]

    def get_notice_title(self, obj):
        if obj.notice:
            return obj.notice.title
        if obj.project:
            return f"[{obj.project.code}] {obj.project.title}"
        return obj.title or 'Notification'

    def get_notice_category(self, obj):
        if obj.notice:
            return obj.notice.category
        if obj.project:
            return 'Project Assignment'
        return 'General'

    def get_notice_priority(self, obj):
        if obj.notice:
            return obj.notice.priority
        return 'High' if obj.type == 'project' else 'General'

    def get_notice_date(self, obj):
        if obj.notice and obj.notice.created_at:
            return obj.notice.created_at.strftime('%b %d, %Y %I:%M %p')
        return obj.created_at.strftime('%b %d, %Y %I:%M %p') if obj.created_at else ''