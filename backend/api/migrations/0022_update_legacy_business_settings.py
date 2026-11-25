from django.db import migrations, models


BUSINESS_NAME = 'New Light Health Services'
BUSINESS_ADDRESS = '23 Musheshe upper Sakponba Road Benin City Edo state'
LEGACY_NAMES = {'New Light Medicine and Store', 'New Light Health Services and Store'}
LEGACY_ADDRESSES = {
    '',
    '2 ehiorobo street Benin city edo state',
    '2 Ehiorobo Street Benin City Edo State',
}


def update_legacy_business_settings(apps, schema_editor):
    SystemSettings = apps.get_model('api', 'SystemSettings')
    for settings in SystemSettings.objects.all().iterator():
        updates = []
        if settings.shop_name in LEGACY_NAMES:
            settings.shop_name = BUSINESS_NAME
            updates.append('shop_name')
        if (settings.address or '').strip() in LEGACY_ADDRESSES:
            settings.address = BUSINESS_ADDRESS
            updates.append('address')
        if updates:
            settings.save(update_fields=updates)


class Migration(migrations.Migration):
    dependencies = [('api', '0021_drug_unit_cost_product_unit_cost_saleitem_unit_cost_and_more')]

    operations = [
        migrations.AlterField(
            model_name='systemsettings',
            name='shop_name',
            field=models.CharField(default='New Light Health Services', max_length=255),
        ),
        migrations.RunPython(update_legacy_business_settings, migrations.RunPython.noop),
    ]
