import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from api.models import Staff

def sync_staff():
    print(f"--- Syncing Staff Records to User Accounts ---")
    staff_members = Staff.objects.all()
    print(f"Found {staff_members.count()} staff records in database.")

    for s in staff_members:
        email = (s.email or '').strip()
        emp_id = (s.employee_id or '').strip()

        # Determine username
        username = emp_id.lower() if emp_id else (email.split('@')[0].lower() if email else f"staff_{s.id}")

        # Check if user already exists by username or email
        user = User.objects.filter(username__iexact=username).first()
        if not user and email:
            user = User.objects.filter(email__iexact=email).first()

        if not user:
            is_admin = bool(s.role and 'admin' in s.role.lower())
            user = User.objects.create_user(
                username=username,
                email=email,
                password='admin123',
                is_staff=True,
                is_superuser=is_admin
            )
            print(f"Created new User account for staff '{s.full_name}': Username='{user.username}', Email='{user.email}'")
        else:
            if email and user.email != email:
                user.email = email
                user.save()
            print(f"User account exists for '{s.full_name}': Username='{user.username}', Email='{user.email}'")

if __name__ == '__main__':
    sync_staff()
