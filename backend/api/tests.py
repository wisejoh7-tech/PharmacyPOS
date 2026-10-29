from django.test import TestCase
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from .models import Staff

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
