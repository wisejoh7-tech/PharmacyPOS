import os
import tempfile
import sqlite3
from django.test import TestCase, TransactionTestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import Category, Drug, Product, Staff

class HealthCheckAndApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_health_check(self):
        response = self.client.get('/api/health-check/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('status', response.data)
        self.assertEqual(response.data['status'], 'healthy')

    def test_role_based_login(self):
        # Create a staff member and associated user
        staff = Staff.objects.create(
            full_name="Jane Pharmacist",
            email="jane@pharmacy.com",
            phone_number="1234567890",
            role="Pharmacist",
            department="Pharmacy",
            employee_id="EMP-202"
        )
        user = User.objects.create_user(
            username="emp-202",
            email="jane@pharmacy.com",
            password="password123",
            is_staff=True
        )

        response = self.client.post('/api/token/', {
            'username': 'emp-202',
            'password': 'password123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertEqual(response.data['role'], 'Pharmacist')
        self.assertEqual(response.data['full_name'], 'Jane Pharmacist')
        self.assertEqual(response.data['department'], 'Pharmacy')

    def test_non_superuser_non_staff_record_login(self):
        # Create a user that is not a superuser and does not have a Staff record entry
        user = User.objects.create_user(
            username="admin",
            password="adminpassword",
            is_staff=True,
            is_superuser=False
        )

        response = self.client.post('/api/token/', {
            'username': 'admin',
            'password': 'adminpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertEqual(response.data['role'], 'Staff')
        self.assertEqual(response.data['department'], 'General')

    def test_login_with_staff_record_having_none_fields(self):
        staff = Staff.objects.create(
            full_name="",
            email="nonefields@pharmacy.com",
            phone_number="0000000000",
            role="",
            department="",
            employee_id="EMP-NONE"
        )
        user = User.objects.create_user(
            username="emp-none",
            email="nonefields@pharmacy.com",
            password="password123",
            is_staff=True
        )

        response = self.client.post('/api/token/', {
            'username': 'emp-none',
            'password': 'password123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertEqual(response.data['role'], 'Staff')

    def test_system_settings_public_access(self):
        response = self.client.get('/api/settings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_root_level_url_aliases(self):
        # Verify /health-check/
        res_health = self.client.get('/health-check/')
        self.assertEqual(res_health.status_code, status.HTTP_200_OK)
        self.assertEqual(res_health.data['status'], 'healthy')

        # Verify /settings/
        res_settings = self.client.get('/settings/')
        self.assertEqual(res_settings.status_code, status.HTTP_200_OK)

        # Verify /token/ and /login/
        user = User.objects.create_user(username="testuser", password="password123")
        res_token = self.client.post('/token/', {'username': 'testuser', 'password': 'password123'})
        self.assertEqual(res_token.status_code, status.HTTP_200_OK)
        self.assertIn('access', res_token.data)

        res_login = self.client.post('/login/', {'username': 'testuser', 'password': 'password123'})
        self.assertEqual(res_login.status_code, status.HTTP_200_OK)
        self.assertIn('access', res_login.data)

    def test_root_level_api_router_urls(self):
        user = User.objects.create_user(username="testadmin", password="password123", is_staff=True)
        self.client.force_authenticate(user=user)

        endpoints = ['/prescriptions/', '/drugs/', '/customers/', '/categories/', '/staff/', '/users/', '/reports/']
        for ep in endpoints:
            res_root = self.client.get(ep)
            self.assertNotEqual(res_root.status_code, status.HTTP_404_NOT_FOUND, f"Endpoint {ep} returned 404")

            res_api = self.client.get(f'/api{ep}')
            self.assertNotEqual(res_api.status_code, status.HTTP_404_NOT_FOUND, f"Endpoint /api{ep} returned 404")

    def test_category_creation_and_drug_sync(self):
        # Authenticate user
        user = User.objects.create_user(username="testadmin", password="password123", is_staff=True)
        self.client.force_authenticate(user=user)

        # Create Category via API
        cat_res = self.client.post('/api/categories/', {
            'name': 'Antibiotics',
            'type': 'Pharmacy'
        })
        self.assertEqual(cat_res.status_code, status.HTTP_201_CREATED)
        cat_id = cat_res.data['id']

        # Create Drug referencing category_obj
        drug_res = self.client.post('/api/drugs/', {
            'name': 'Amoxicillin',
            'dosage': '500mg',
            'form': 'Capsule',
            'unit_price': 15.00,
            'stock': 100,
            'category_obj': cat_id
        })
        self.assertEqual(drug_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(drug_res.data['category_name'], 'Antibiotics')
        self.assertEqual(drug_res.data['category'], 'Antibiotics')

        # Test product creation with supermarket category
        mkt_cat_res = self.client.post('/api/categories/', {
            'name': 'Beverages',
            'type': 'Supermarket'
        })
        self.assertEqual(mkt_cat_res.status_code, status.HTTP_201_CREATED)
        mkt_cat_id = mkt_cat_res.data['id']

        prod_res = self.client.post('/api/products/', {
            'name': 'Orange Juice',
            'unit_price': 3.50,
            'stock': 50,
            'category_obj': mkt_cat_id
        })
        self.assertEqual(prod_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(prod_res.data['category_name'], 'Beverages')
        self.assertEqual(prod_res.data['category'], 'Beverages')

class CategoryApiTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="testadmin", password="password123", is_staff=True)
        self.client.force_authenticate(user=self.user)

    def test_category_crud_operations(self):
        # 1. GET empty list
        get_res = self.client.get('/api/categories/')
        self.assertEqual(get_res.status_code, status.HTTP_200_OK)

        # 2. POST create category
        post_res = self.client.post('/api/categories/', {
            'name': 'Vitamins',
            'type': 'Pharmacy'
        })
        self.assertEqual(post_res.status_code, status.HTTP_201_CREATED)
        cat_id = post_res.data['id']
        self.assertEqual(post_res.data['name'], 'Vitamins')
        self.assertEqual(post_res.data['type'], 'Pharmacy')

        # 3. PUT update category
        put_res = self.client.put(f'/api/categories/{cat_id}/', {
            'name': 'Vitamins & Supplements',
            'type': 'Pharmacy'
        })
        self.assertEqual(put_res.status_code, status.HTTP_200_OK)
        self.assertEqual(put_res.data['name'], 'Vitamins & Supplements')

        # 4. DELETE category
        del_res = self.client.delete(f'/api/categories/{cat_id}/')
        self.assertEqual(del_res.status_code, status.HTTP_204_NO_CONTENT)

    def test_category_creation_without_type(self):
        post_res = self.client.post('/api/categories/', {
            'name': 'Analgesics'
        })
        self.assertEqual(post_res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(post_res.data['name'], 'Analgesics')
        self.assertEqual(post_res.data['type'], 'Pharmacy')

    def test_duplicate_category_creation(self):
        # First creation
        res1 = self.client.post('/api/categories/', {
            'name': 'Antibiotics',
            'type': 'Pharmacy'
        })
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)

        # Duplicate creation (case-insensitive)
        res2 = self.client.post('/api/categories/', {
            'name': 'antibiotics',
            'type': 'Pharmacy'
        })
        self.assertEqual(res2.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', res2.data)


class SalesInventoryAccessTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.staff = Staff.objects.create(
            full_name='Inventory Sales Attendant',
            email='inventory-attendant@pharmacy.com',
            phone_number='08000000000',
            role='Sales Attendance',
            department='Sales',
            employee_id='EMP-INVENTORY',
        )
        self.user = User.objects.create_user(
            username='emp-inventory',
            email='inventory-attendant@pharmacy.com',
            password='password123',
            is_staff=True,
        )
        self.client.force_authenticate(user=self.user)
        self.pharmacy_category = Category.objects.create(name='Sales Pharmacy', type='Pharmacy')
        self.supermarket_category = Category.objects.create(name='Sales Retail', type='Supermarket')

    def test_sales_attendant_can_create_and_update_drug_without_setting_price(self):
        create_response = self.client.post('/api/drugs/', {
            'name': 'Sales Paracetamol',
            'dosage': '500mg',
            'form': 'Tablet',
            'unit_price': '999.99',
            'stock': 25,
            'category_obj': self.pharmacy_category.id,
        })

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        drug = Drug.objects.get(pk=create_response.data['id'])
        self.assertEqual(drug.stock, 25)
        self.assertEqual(drug.unit_price, 0)

        update_response = self.client.patch(f'/api/drugs/{drug.id}/', {
            'stock': 40,
            'unit_price': '1234.56',
        })

        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        drug.refresh_from_db()
        self.assertEqual(drug.stock, 40)
        self.assertEqual(drug.unit_price, 0)

    def test_sales_attendant_can_create_and_update_product_without_setting_price(self):
        create_response = self.client.post('/api/products/', {
            'name': 'Sales Bottled Water',
            'unit_price': '999.99',
            'stock': 30,
            'category_obj': self.supermarket_category.id,
        })

        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        product = Product.objects.get(pk=create_response.data['id'])
        self.assertEqual(product.stock, 30)
        self.assertEqual(product.unit_price, 0)

        update_response = self.client.patch(f'/api/products/{product.id}/', {
            'stock': 45,
            'unit_price': '1234.56',
        })

        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        product.refresh_from_db()
        self.assertEqual(product.stock, 45)
        self.assertEqual(product.unit_price, 0)


class StaffApiTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(username="adminuser", password="adminpassword123", email="admin@pharmacy.com")
        self.client.force_authenticate(user=self.admin)

    def test_staff_create_update_delete(self):
        # 1. Create Staff
        create_res = self.client.post('/api/staff/', {
            'full_name': 'John Doe',
            'email': 'john.doe@pharmacy.com',
            'phone_number': '+1234567890',
            'role': 'Pharmacist',
            'department': 'Dispensary',
            'employee_id': 'EP-1001'
        })
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)
        staff_id = create_res.data['id']
        self.assertEqual(create_res.data['full_name'], 'John Doe')
        # Check associated user was created
        self.assertTrue(User.objects.filter(username='ep-1001').exists())

        # 2. Update Staff (PUT)
        update_res = self.client.put(f'/api/staff/{staff_id}/', {
            'full_name': 'Johnathan Doe',
            'email': 'johnathan.doe@pharmacy.com',
            'phone_number': '+9876543210',
            'role': 'Senior Pharmacist',
            'department': 'Clinical',
            'employee_id': 'EP-1002'
        })
        self.assertEqual(update_res.status_code, status.HTTP_200_OK)
        self.assertEqual(update_res.data['full_name'], 'Johnathan Doe')
        self.assertEqual(update_res.data['role'], 'Senior Pharmacist')
        self.assertEqual(update_res.data['employee_id'], 'EP-1002')

        # Check updated associated user username and email
        self.assertTrue(User.objects.filter(username='ep-1002', email='johnathan.doe@pharmacy.com').exists())

        # 3. Delete Staff (DELETE)
        delete_res = self.client.delete(f'/api/staff/{staff_id}/')
        self.assertEqual(delete_res.status_code, status.HTTP_204_NO_CONTENT)

        # Verify staff record is gone
        self.assertFalse(Staff.objects.filter(id=staff_id).exists())
        # Verify associated non-superuser user is deleted
        self.assertFalse(User.objects.filter(username='ep-1002').exists())

    def test_staff_registration_with_optional_fields_blank(self):
        # Test registering a staff member with empty email, phone_number, and department
        res = self.client.post('/api/staff/', {
            'full_name': 'Optional Field User',
            'role': 'Nurse',
            'employee_id': 'EP-OPTIONAL-1',
            'email': '',
            'phone_number': '',
            'department': ''
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['full_name'], 'Optional Field User')
        self.assertIsNone(res.data['email'])
        self.assertTrue(User.objects.filter(username='ep-optional-1').exists())


class CustomExceptionHandlingTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_custom_handler404_json_response(self):
        response = self.client.get('/non-existent-path-for-testing/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.headers.get('Content-Type'), 'application/json')
        data = response.json()
        self.assertIn('detail', data)

    def test_custom_handler500_json_response(self):
        from api.exceptions import custom_handler500
        from django.test import RequestFactory
        factory = RequestFactory()
        request = factory.get('/api/test-500/')
        response = custom_handler500(request)
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.headers.get('Content-Type'), 'application/json')
        data = response.content.decode('utf-8')
        self.assertIn('Server Error (500)', data)

    def test_custom_exception_handler_drf(self):
        from api.exceptions import custom_exception_handler
        response = custom_exception_handler(RuntimeError("Test error"), {})
        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('detail', response.data)


class AllowedHostsTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_allowed_hosts_headers(self):
        hosts_to_test = [
            'pharmacypos-fge3.onrender.com',
            'pharmacy-api-exn3.onrender.com',
            'custom-app.onrender.com',
        ]
        for host in hosts_to_test:
            response = self.client.get('/api/health-check/', HTTP_HOST=host)
            self.assertEqual(
                response.status_code,
                status.HTTP_200_OK,
                f"Request with HTTP_HOST '{host}' failed with status {response.status_code}"
            )


class MigrationRunnerTestCase(TestCase):
    def test_safe_migrate_execution(self):
        from run_migrations import safe_migrate
        # Should execute successfully without throwing exceptions
        result = safe_migrate()
        self.assertTrue(result)

    def test_safe_migrate_recovers_when_schema_already_exists(self):
        from run_migrations import safe_migrate
        from django.db import connection
        from django.db.migrations.recorder import MigrationRecorder

        # Simulate missing migration history where tables already exist
        recorder = MigrationRecorder(connection)
        with connection.cursor() as cur:
            cur.execute("DELETE FROM django_migrations WHERE app = 'api' AND name > '0001_initial'")

        # safe_migrate should catch schema discrepancy and fake/sync migrations
        result = safe_migrate()
        self.assertTrue(result)

        # Verify all api migrations are applied
        applied = [name for app, name in recorder.applied_migrations() if app == 'api']
        self.assertIn('0018_alter_staff_department_alter_staff_email_and_more', applied)

    def test_delete_table_utility(self):
        from delete_table import drop_tables
        from django.db import connection

        with connection.cursor() as cur:
            cur.execute("CREATE TABLE IF NOT EXISTS test_dummy_table (id integer primary key)")

        tables_before = connection.introspection.table_names()
        self.assertIn('test_dummy_table', tables_before)

        dropped = drop_tables(['test_dummy_table'])
        self.assertIn('test_dummy_table', dropped)

        tables_after = connection.introspection.table_names()
        self.assertNotIn('test_dummy_table', tables_after)

    def test_safe_migrate_with_orphaned_customer_table(self):
        import subprocess
        import sys

        # Run an isolated python process pointing to a fresh database with an orphaned api_customer table
        tmp_db = tempfile.mktemp(suffix='.sqlite3')
        con = sqlite3.connect(tmp_db)
        con.execute('CREATE TABLE api_customer (id integer primary key)')
        con.commit()
        con.close()

        test_code = f"""
import os, sys, django
sys.path.insert(0, 'backend')
os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings'
os.environ['DATABASE_URL'] = 'sqlite:///{tmp_db}'
django.setup()

from run_migrations import safe_migrate
from django.db import connection
from django.db.migrations.recorder import MigrationRecorder

result = safe_migrate()
assert result is True

recorder = MigrationRecorder(connection)
applied = [name for app, name in recorder.applied_migrations() if app == 'api']
assert '0001_initial' in applied
assert '0018_alter_staff_department_alter_staff_email_and_more' in applied

tables = connection.introspection.table_names()
assert 'api_customer' in tables
assert 'api_drug' in tables
"""
        cmd = [sys.executable, '-c', test_code]
        proc = subprocess.run(cmd, capture_output=True, text=True)
        try:
            os.remove(tmp_db)
        except OSError:
            pass

        self.assertEqual(proc.returncode, 0, f"Subprocess failed with stdout:\n{proc.stdout}\nstderr:\n{proc.stderr}")


class SalesRepInventoryWorkflowIntegrationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        Staff.objects.create(
            full_name='End-to-End Sales Rep',
            email='e2e-rep@pharmacy.com',
            phone_number='08000000001',
            role='Sales Rep',
            department='Sales',
            employee_id='E2E-REP',
        )
        User.objects.create_user(
            username='e2e-rep',
            email='e2e-rep@pharmacy.com',
            password='password123',
            is_staff=True,
        )

    def authenticate_sales_rep(self):
        login_response = self.client.post('/api/token/', {
            'username': 'E2E-REP',
            'password': 'password123',
        })
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertEqual(login_response.data['role'], 'Sales Rep')
        self.assertFalse(login_response.data['is_admin'])
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}")

    def test_sales_rep_completes_inventory_management_workflow(self):
        self.authenticate_sales_rep()

        pharmacy_dashboard = self.client.get('/api/sales/dashboard-stats/')
        supermarket_dashboard = self.client.get('/api/supermarket-sales/dashboard-stats/')
        self.assertEqual(pharmacy_dashboard.status_code, status.HTTP_200_OK)
        self.assertEqual(supermarket_dashboard.status_code, status.HTTP_200_OK)
        self.assertIn('low_stock_count', pharmacy_dashboard.data)
        self.assertIn('low_stock_count', supermarket_dashboard.data)

        pharmacy_category = self.client.post('/api/categories/', {
            'name': 'E2E Pharmacy Category',
            'type': 'Pharmacy',
        })
        supermarket_category = self.client.post('/api/categories/', {
            'name': 'E2E Supermarket Category',
            'type': 'Supermarket',
        })
        self.assertEqual(pharmacy_category.status_code, status.HTTP_201_CREATED)
        self.assertEqual(supermarket_category.status_code, status.HTTP_201_CREATED)

        drug_response = self.client.post('/api/drugs/', {
            'name': 'E2E Sales Drug',
            'dosage': '500mg',
            'form': 'Tablet',
            'unit_price': '999.99',
            'stock': 12,
            'reorder_level': 3,
            'category_obj': pharmacy_category.data['id'],
        })
        product_response = self.client.post('/api/products/', {
            'name': 'E2E Sales Product',
            'unit_price': '888.88',
            'stock': 20,
            'reorder_level': 5,
            'category_obj': supermarket_category.data['id'],
        })
        self.assertEqual(drug_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(product_response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(drug_response.data['unit_price'], '0.00')
        self.assertEqual(product_response.data['unit_price'], '0.00')

        drug_id = drug_response.data['id']
        product_id = product_response.data['id']
        drug_update = self.client.patch(f'/api/drugs/{drug_id}/', {
            'stock': 18,
            'unit_price': '777.77',
        })
        product_update = self.client.patch(f'/api/products/{product_id}/', {
            'stock': 25,
            'unit_price': '666.66',
        })
        self.assertEqual(drug_update.status_code, status.HTTP_200_OK)
        self.assertEqual(product_update.status_code, status.HTTP_200_OK)
        self.assertEqual(drug_update.data['stock'], 18)
        self.assertEqual(product_update.data['stock'], 25)
        self.assertEqual(drug_update.data['unit_price'], '0.00')
        self.assertEqual(product_update.data['unit_price'], '0.00')

        pharmacy_inventory = self.client.get('/api/drugs/')
        supermarket_inventory = self.client.get('/api/products/')
        self.assertEqual(pharmacy_inventory.status_code, status.HTTP_200_OK)
        self.assertEqual(supermarket_inventory.status_code, status.HTTP_200_OK)
        self.assertTrue(any(item['id'] == drug_id for item in pharmacy_inventory.data))
        self.assertTrue(any(item['id'] == product_id for item in supermarket_inventory.data))

        self.assertEqual(self.client.delete(f'/api/drugs/{drug_id}/').status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.client.delete(f'/api/products/{product_id}/').status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.client.delete(f"/api/categories/{pharmacy_category.data['id']}/").status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.client.delete(f"/api/categories/{supermarket_category.data['id']}/").status_code, status.HTTP_204_NO_CONTENT)


class StaffIdentityAndInventoryPermissionRegressionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_superuser(username='regression-admin', password='admin-pass')
        self.client.force_authenticate(user=self.admin)

    def test_custom_username_and_password_are_linked_and_update_safely(self):
        response = self.client.post('/api/staff/', {'full_name':'Identity Staff','role':'Pharmacist','employee_id':'ID-001','username':'custom-login','password':'initial-pass','email':'identity@example.com'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        staff = Staff.objects.get(pk=response.data['id'])
        user = User.objects.get(username='custom-login')
        self.assertEqual(staff.user_id, user.id)
        self.assertEqual(response.data['login_username'], 'custom-login')
        updated = self.client.patch(f'/api/staff/{staff.id}/', {'username':'renamed-login','password':'updated-pass','employee_id':'ID-002'})
        self.assertEqual(updated.status_code, status.HTTP_200_OK, updated.data)
        user.refresh_from_db()
        staff.refresh_from_db()
        self.assertEqual(staff.user_id, user.id)
        self.assertEqual(user.username, 'renamed-login')
        self.assertTrue(user.check_password('updated-pass'))
        self.assertEqual(updated.data['login_username'], 'renamed-login')

        profile_update = self.client.patch(f'/api/staff/{staff.id}/', {'phone_number': '08012345678'})
        self.assertEqual(profile_update.status_code, status.HTTP_200_OK)
        user.refresh_from_db()
        self.assertEqual(user.username, 'renamed-login')

        login = self.client.post('/api/token/', {'username': 'renamed-login', 'password': 'updated-pass'})
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        self.assertEqual(login.data['role'], 'Pharmacist')

    def test_staff_create_cannot_take_over_existing_unrelated_user(self):
        User.objects.create_user(username='already-used', password='secret')
        response = self.client.post('/api/staff/', {'full_name':'Attempt','role':'Pharmacist','employee_id':'TAKEOVER','username':'already-used'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(Staff.objects.filter(employee_id='TAKEOVER').exists())
        self.assertTrue(User.objects.get(username='already-used').check_password('secret'))

    def test_non_sales_roles_cannot_set_or_change_prices_but_admin_can(self):
        staff = Staff.objects.create(full_name='Pharmacist', role='Pharmacist', employee_id='PHARM-01')
        user = User.objects.create_user(username='pharm-01', password='pw', is_staff=True)
        staff.user = user; staff.save(update_fields=['user'])
        self.client.force_authenticate(user=user)
        drug = self.client.post('/api/drugs/', {'name':'New drug','dosage':'10mg','form':'tablet','unit_price':'52','stock':2})
        self.assertEqual(drug.status_code, status.HTTP_201_CREATED, drug.data)
        self.assertEqual(drug.data['unit_price'], '0.00')
        self.client.patch(f"/api/drugs/{drug.data['id']}/", {'unit_price':'99','stock':4})
        self.assertEqual(Drug.objects.get(pk=drug.data['id']).unit_price, 0)
        product = self.client.post('/api/products/', {'name':'New item','unit_price':'52','stock':2})
        self.assertEqual(product.data['unit_price'], '0.00')
        self.client.patch(f"/api/products/{product.data['id']}/", {'unit_price':'99','stock':4})
        self.assertEqual(Product.objects.get(pk=product.data['id']).unit_price, 0)
        self.client.force_authenticate(user=self.admin)
        self.assertEqual(self.client.patch(f"/api/drugs/{drug.data['id']}/", {'unit_price':'12.50'}).data['unit_price'], '12.50')
        self.assertEqual(self.client.patch(f"/api/products/{product.data['id']}/", {'unit_price':'8.25'}).data['unit_price'], '8.25')
