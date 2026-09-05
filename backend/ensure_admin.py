import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ccportal.settings')
django.setup()

from django.contrib.auth.models import User
from teamcc.models import Department, UserProfile, MembershipCard
from datetime import date

def ensure_admins():
    print("=" * 60)
    print("Code Crashers - Ensuring Production Superuser Accounts")
    print("=" * 60)

    default_admin_pass = os.environ.get('ADMIN_PASSWORD', 'cc25?MP')

    # Ensure Developer Department exists
    dept, _ = Department.objects.get_or_create(
        dept_name='dev',
        defaults={'desc': 'DEVELOPER'}
    )

    admin_profiles = [
        {
            'username': 'ltAdmin@teamcc',
            'email': 'ltAdmin@teamcc.org',
            'password': default_admin_pass,
            'name': 'Lead Administrator',
            'member_id': 'CC-ADMIN-01',
        },
        {
            'username': 'ltAdmin@teamCC',
            'email': 'ltAdmin@teamcc.org',
            'password': default_admin_pass,
            'name': 'Lead Administrator',
            'member_id': 'CC-ADMIN-01',
        },
        {
            'username': 'admin',
            'email': 'admin@teamcc.org',
            'password': default_admin_pass,
            'name': 'System Administrator',
            'member_id': 'CC-ADMIN-ROOT',
        },
    ]

    for acc in admin_profiles:
        user, created = User.objects.get_or_create(
            username=acc['username'],
            defaults={
                'email': acc['email'],
                'first_name': acc['name'],
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        user.email = acc['email']
        user.is_staff = True
        user.is_superuser = True
        user.is_active = True
        user.set_password(acc['password'])
        user.save()

        UserProfile.objects.get_or_create(
            user=user,
            defaults={
                'name': acc['name'],
                'gender': 'Other',
                'year': '4th Year',
                'semester': '8th Semester',
                'class_roll': 'DEV/ADMIN/01',
                'university_roll': '10900121001',
                'avatar': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250',
                'bio': 'System Administrator'
            }
        )

        MembershipCard.objects.get_or_create(
            user=user,
            defaults={
                'department': dept,
                'member_id': acc['member_id'],
                'role': 'Lead Administrator',
                'category': 'Core',
                'badge': 'System Admin',
                'joined_date': date(2023, 1, 15),
                'expiry_date': date(2027, 1, 15)
            }
        )
        status_label = "CREATED" if created else "UPDATED"
        print(f" [+] [{status_label}] Superuser: {acc['username']} (Staff: True, Superuser: True)")

    # Ensure Developer / Admin Subhajit has superuser & staff privileges
    subha_users = User.objects.filter(email='subha.ibm.24@gmail.com')
    for u in subha_users:
        u.is_staff = True
        u.is_superuser = True
        subha_custom_pass = os.environ.get('SUBHA_ADMIN_PASSWORD')
        if subha_custom_pass:
            u.set_password(subha_custom_pass)
        u.save()
        print(f" [+] [UPDATED] Granted Superuser & Staff to {u.username}")

    print("=" * 60)
    print("Admin accounts ensured successfully! Login ready with password:", default_admin_pass)
    print("=" * 60)

if __name__ == '__main__':
    ensure_admins()
