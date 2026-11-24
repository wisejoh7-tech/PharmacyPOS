import os
import django


def ensure_admin():
    from django.contrib.auth.models import User

    admin_username = os.environ.get('ADMIN_USERNAME', 'admin').strip() or 'admin'
    admin_email = os.environ.get('ADMIN_EMAIL', 'admin@example.com').strip() or 'admin@example.com'
    admin_password = os.environ.get('ADMIN_PASSWORD', 'admin123').strip() or 'admin123'

    print(f"--- Processing Admin and Staff Credentials ---")
    print(f"Target Username: {admin_username}")
    print(f"Target Email: {admin_email}")

    # Ensure specified admin superuser exists and is up-to-date
    admin_user = User.objects.filter(username=admin_username).first()
    if admin_user:
        admin_user.email = admin_email
        admin_user.set_password(admin_password)
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()
        print(f"Updated existing superuser '{admin_username}' with configured email and password.")
    else:
        User.objects.create_superuser(username=admin_username, email=admin_email, password=admin_password)
        print(f"Created new superuser '{admin_username}' with email '{admin_email}'.")


if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    django.setup()
    ensure_admin()
