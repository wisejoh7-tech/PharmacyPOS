from decimal import Decimal

from django.contrib.auth.models import User
from rest_framework.test import APITestCase

from .models import Drug, Product, Sale, SupermarketSale


class IdempotentOfflineSaleSyncTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            username='offline-sync-admin',
            password='test-password',
            email='offline-sync@example.com',
        )
        self.client.force_authenticate(user=self.admin)
        self.drug = Drug.objects.create(
            name='Offline test medicine', dosage='10mg', form='Tablet',
            unit_price=Decimal('10.00'), stock=12,
        )
        self.product = Product.objects.create(
            name='Offline test grocery', unit_price=Decimal('5.00'), stock=15,
        )

    def test_retried_pharmacy_sale_is_returned_without_duplicate_or_second_stock_decrement(self):
        payload = {
            'transaction_id': 'OFFLINE-PH-RETRY-001',
            'total_amount': '21.00',
            'payment_method': 'Cash',
            'items': [{'drug': self.drug.id, 'quantity': 2, 'unit_price': '10.00', 'subtotal': '20.00'}],
        }

        first = self.client.post('/api/sales/', payload, format='json')
        retry = self.client.post('/api/sales/', payload, format='json')

        self.assertEqual(first.status_code, 201)
        self.assertEqual(retry.status_code, 200)
        self.assertEqual(first.data['id'], retry.data['id'])
        self.assertEqual(Sale.objects.filter(transaction_id=payload['transaction_id']).count(), 1)
        self.drug.refresh_from_db()
        self.assertEqual(self.drug.stock, 10)

    def test_retried_supermarket_sale_is_returned_without_duplicate_or_second_stock_decrement(self):
        payload = {
            'transaction_id': 'OFFLINE-MK-RETRY-001',
            'total_amount': '10.75',
            'payment_method': 'Cash',
            'items': [{'product': self.product.id, 'quantity': 2, 'unit_price': '5.00', 'subtotal': '10.00'}],
        }

        first = self.client.post('/api/supermarket-sales/', payload, format='json')
        retry = self.client.post('/api/supermarket-sales/', payload, format='json')

        self.assertEqual(first.status_code, 201)
        self.assertEqual(retry.status_code, 200)
        self.assertEqual(first.data['id'], retry.data['id'])
        self.assertEqual(SupermarketSale.objects.filter(transaction_id=payload['transaction_id']).count(), 1)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 13)
