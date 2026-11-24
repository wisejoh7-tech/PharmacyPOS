from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def backfill_staff_users(apps, schema_editor):
    Staff = apps.get_model('api', 'Staff')
    User = apps.get_model(*settings.AUTH_USER_MODEL.split('.'))
    db = schema_editor.connection.alias
    for staff in Staff.objects.using(db).filter(user__isnull=True).iterator():
        # Only backfill exact legacy username or uniquely matching email, and never reuse a linked user.
        user = User.objects.using(db).filter(username__iexact=(staff.employee_id or '').lower()).first()
        if user is None and staff.email:
            matches = User.objects.using(db).filter(email__iexact=staff.email)
            if matches.count() == 1:
                user = matches.first()
        if user and not Staff.objects.using(db).filter(user_id=user.pk).exclude(pk=staff.pk).exists():
            staff.user_id = user.pk
            staff.save(update_fields=['user'], using=db)


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0019_supermarketsale_customer'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]
    operations = [
        migrations.AddField(model_name='staff', name='user', field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='pharmacy_staff', to=settings.AUTH_USER_MODEL)),
        migrations.RunPython(backfill_staff_users, migrations.RunPython.noop),
    ]
