import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ccportal.settings')
django.setup()

from django.contrib.auth.models import User
from django.db import IntegrityError
from teamcc.models import Department, UserProfile, MembershipCard

def ensure_admins():
    print("=" * 60)
    print("Code Crashers - Ensuring Production Superuser Accounts")
    print("=" * 60)

    default_admin_pass = os.environ.get('ADMIN_PASSWORD', 'cc25?MP')

    # 1. Ensure Developer Department exists
    try:
        dept, _ = Department.objects.get_or_create(
            dept_name='dev',
            defaults={'desc': 'DEVELOPER'}
        )
    except Exception as e:
        dept = Department.objects.filter(dept_name='dev').first()

    # 2. Ensure Lead Admin (handles both ltAdmin@teamcc and ltAdmin@teamCC)
    try:
        lead_admin = User.objects.filter(username__iexact='ltAdmin@teamcc').first()
        if not lead_admin:
            lead_admin, _ = User.objects.get_or_create(
                username='ltAdmin@teamcc',
                defaults={
                    'email': 'ltAdmin@teamcc.org',
                    'first_name': 'Lead Administrator',
                    'is_staff': True,
                    'is_superuser': True,
                    'is_active': True,
                }
            )
        lead_admin.set_password(default_admin_pass)
        lead_admin.is_staff = True
        lead_admin.is_superuser = True
        lead_admin.is_active = True
        lead_admin.save()

        # Ensure UserProfile
        UserProfile.objects.get_or_create(
            user=lead_admin,
            defaults={
                'name': 'Lead Administrator',
                'gender': 'Other',
                'year': '4th Year',
                'semester': '8th Semester',
                'class_roll': 'DEV/ADMIN/01',
                'university_roll': '10900121001',
                'avatar': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
                'bio': 'System Administrator'
            }
        )

        # Ensure MembershipCard (safe check to prevent UNIQUE constraint error)
        if not MembershipCard.objects.filter(user=lead_admin).exists():
            mem_id = 'CC-ADMIN-01'
            if MembershipCard.objects.filter(member_id=mem_id).exists():
                mem_id = f"CC-ADMIN-{lead_admin.id}"
            MembershipCard.objects.create(
                user=lead_admin,
                department=dept,
                member_id=mem_id,
                role='Lead Administrator',
                category='Core',
                badge='System Admin',
                joined_date=date(2023, 1, 15),
                expiry_date=date(2027, 1, 15)
            )
        print(f" [+] Superuser ensured: {lead_admin.username} (Staff: True, Superuser: True)")
    except Exception as e:
        print(f" [!] Note on lead admin setup: {e}")

    # 3. Ensure 'admin' root superuser
    try:
        root_admin, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@teamcc.org',
                'first_name': 'System Administrator',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        root_admin.set_password(default_admin_pass)
        root_admin.is_staff = True
        root_admin.is_superuser = True
        root_admin.is_active = True
        root_admin.save()

        UserProfile.objects.get_or_create(
            user=root_admin,
            defaults={
                'name': 'System Administrator',
                'gender': 'Other',
                'year': '4th Year',
                'semester': '8th Semester',
                'class_roll': 'SYS/ADMIN/01',
                'university_roll': '10900121000',
                'bio': 'System Administrator'
            }
        )

        if not MembershipCard.objects.filter(user=root_admin).exists():
            mem_id = 'CC-ADMIN-ROOT'
            if MembershipCard.objects.filter(member_id=mem_id).exists():
                mem_id = f"CC-ROOT-{root_admin.id}"
            MembershipCard.objects.create(
                user=root_admin,
                department=dept,
                member_id=mem_id,
                role='Lead Administrator',
                category='Core',
                badge='System Admin',
                joined_date=date(2023, 1, 15),
                expiry_date=date(2027, 1, 15)
            )
        status_label = "CREATED" if created else "UPDATED"
        print(f" [+] [{status_label}] Superuser: admin (Staff: True, Superuser: True)")
    except Exception as e:
        print(f" [!] Note on root admin setup: {e}")

    # 4. Ensure Developer / Admin Subhajit has superuser & staff privileges
    try:
        subha_users = User.objects.filter(email='subha.ibm.24@gmail.com')
        for u in subha_users:
            u.is_staff = True
            u.is_superuser = True
            u.is_active = True
            subha_custom_pass = os.environ.get('SUBHA_ADMIN_PASSWORD')
            if subha_custom_pass:
                u.set_password(subha_custom_pass)
            u.save()
            print(f" [+] [UPDATED] Granted Superuser & Staff to {u.username}")
    except Exception as e:
        print(f" [!] Note on subha user privileges: {e}")

    print("=" * 60)
    print("Admin accounts ensured successfully! Login ready with password:", default_admin_pass)
    print("=" * 60)

if __name__ == '__main__':
    ensure_admins()
