import os
import django
from datetime import date, timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ccportal.settings')
django.setup()

from django.contrib.auth.models import User
from teamcc.models import (
    Department, 
    UserProfile, 
    MembershipCard, 
    Project, 
    NoticeSheet, 
    Attendance, 
    RoleAuditLog
)

def seed():
    print("Starting Database Seeding for Code Crashers (Team CC)...")

    # 1. Seed Departments
    departments = [
        ('ui/ux', 'UI/UX DESIGNER'),
        ('dev', 'DEVELOPER'),
        ('doc', 'DOCUMANTARY'),
        ('res', 'RESEARCH'),
        ('iot', 'IOT'),
        ('mkt', 'MARKETING'),
    ]

    dept_objs = {}
    for code, name in departments:
        dept, _ = Department.objects.get_or_create(dept_name=code, defaults={'desc': name})
        dept_objs[code] = dept
    print("[+] Departments seeded.")

    # 2. Seed Root Lead Administrator (ltAdmin@teamcc / cc25?MP)
    admin_email = 'ltAdmin@teamcc'
    admin_pass = 'cc25?MP'
    admin_user, created = User.objects.get_or_create(
        username=admin_email,
        defaults={
            'email': admin_email,
            'is_staff': True,
            'is_superuser': True,
            'first_name': 'Lead Administrator'
        }
    )
    admin_user.set_password(admin_pass)
    admin_user.is_staff = True
    admin_user.is_superuser = True
    admin_user.save()

    UserProfile.objects.get_or_create(
        user=admin_user,
        defaults={
            'name': 'Lead Administrator',
            'contact': '',
            'gender': 'Other',
            'year': '4th Year',
            'semester': '8th Semester',
            'class_roll': 'DEV/ADMIN/01',
            'university_roll': '10900121001',
            'avatar': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
            'bio': 'Chief System Administrator & Coordinator for Code Crashers portal architecture.'
        }
    )

    MembershipCard.objects.get_or_create(
        user=admin_user,
        defaults={
            'department': dept_objs['dev'],
            'member_id': 'CC-ADMIN-01',
            'role': 'Lead Administrator',
            'category': 'Core',
            'badge': 'System Admin',
            'joined_date': date(2023, 1, 15),
            'expiry_date': date(2027, 1, 15)
        }
    )
    print(f"[+] Lead Admin seeded ({admin_email} / {admin_pass}).")

    # 3. Clean up any previous dummy test data
    dummy_emails = [
        'sarah.connor@teamcc.org',
        'rohan.sharma@teamcc.org',
        'ananya.verma@teamcc.org',
        'devansh.roy@teamcc.org'
    ]
    deleted_users, _ = User.objects.filter(email__in=dummy_emails).delete()
    if deleted_users:
        print(f"[+] Cleaned {deleted_users} dummy user accounts.")

    Project.objects.filter(code__in=['PR-111', 'PR-112', 'PR-113']).delete()
    NoticeSheet.objects.filter(title__in=[
        'Annual Hackathon 2026 Registration Open',
        'Weekly Sync & System Architecture Workshop',
        'Membership Card Part 2 Verification Notice'
    ]).delete()

    print("[SUCCESS] Production Database Setup Complete (Zero Dummy Data)!")

if __name__ == '__main__':
    seed()
