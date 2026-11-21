from django.db import migrations, models
import django.db.models.deletion

class Migration(migrations.Migration):
    dependencies = [
        ('api', '0018_alter_staff_department_alter_staff_email_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='supermarketsale',
            name='customer',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='api.customer'),
        ),
    ]
