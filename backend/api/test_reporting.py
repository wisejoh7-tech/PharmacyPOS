from decimal import Decimal

from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework.test import APIClient, APITestCase

from .models import (
    Category,
    Drug,
    Product,
    Sale,
    SaleItem,
    SaleReturn,
    Staff,
    SupermarketSale,
    SupermarketSaleItem,
)


class SalesProfitReportTests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(username='report-admin', password='pass', email='report-admin@example.com')
        self.client.force_authenticate(user=self.admin)
        self.pharmacy_category = Category.objects.create(name='Report Pharmacy', type='Pharmacy')
        self.market_category = Category.objects.create(name='Report Market', type='Supermarket')
        self.drug = Drug.objects.create(
            name='Report medicine', dosage='10mg', form='Tablet', category_obj=self.pharmacy_category,
            unit_price=Decimal('10.00'), unit_cost=Decimal('4.00'), stock=20,
        )
        self.product = Product.objects.create(
            name='Report grocery', category_obj=self.market_category,
            unit_price=Decimal('5.00'), unit_cost=Decimal('2.00'), stock=20,
        )
        self.pharmacy_sale = Sale.objects.create(
            transaction_id='REPORT-PH-001', total_amount=Decimal('21.00'), payment_method='Cash',
        )
        SaleItem.objects.create(
            sale=self.pharmacy_sale, drug=self.drug, quantity=2,
            unit_price=Decimal('10.00'), subtotal=Decimal('20.00'), unit_cost=Decimal('4.00'),
        )
        SaleReturn.objects.create(
            sale=self.pharmacy_sale, drug=self.drug, quantity=1,
            reason='Customer return', refund_amount=Decimal('10.00'),
        )
        self.market_sale = SupermarketSale.objects.create(
            transaction_id='REPORT-MK-001', total_amount=Decimal('10.00'), payment_method='Card',
        )
        SupermarketSaleItem.objects.create(
            sale=self.market_sale, product=self.product, quantity=2,
            unit_price=Decimal('5.00'), subtotal=Decimal('10.00'), unit_cost=Decimal('2.00'),
        )

    def test_admin_report_combines_sales_deducts_returns_and_calculates_only_known_profit(self):
        response = self.client.get('/api/reports/sales/')

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['include_profit'])
        summary = response.data['summary']
        self.assertEqual(summary['transaction_count'], 2)
        self.assertEqual(summary['total_amount'], '31.00')
        self.assertEqual(summary['sales_subtotal'], '30.00')
        self.assertEqual(summary['refunds'], '10.00')
        self.assertEqual(summary['net_sales'], '20.00')
        self.assertEqual(summary['cost_of_goods_sold'], '8.00')
        self.assertEqual(summary['gross_profit'], '12.00')
        self.assertEqual(summary['gross_margin_percent'], 60.0)
        self.assertEqual(summary['costed_sales'], 2)
        self.assertEqual(summary['uncosted_sales'], 0)

    def test_report_filters_date_type_payment_product_and_search(self):
        today = timezone.localdate().isoformat()
        response = self.client.get('/api/reports/sales/', {
            'start_date': today,
            'end_date': today,
            'sale_type': 'supermarket',
            'payment_method': 'card',
            'product': 'grocery',
            'search': 'REPORT-MK',
        })

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['summary']['transaction_count'], 1)
        self.assertEqual(response.data['sales'][0]['transaction_id'], 'REPORT-MK-001')
        self.assertEqual(response.data['sales'][0]['gross_profit'], '6.00')

    def test_invalid_dates_and_sale_types_return_helpful_validation_errors(self):
        invalid_date = self.client.get('/api/reports/sales/', {'start_date': 'not-a-date'})
        invalid_range = self.client.get('/api/reports/sales/', {'start_date': '2026-11-25', 'end_date': '2026-11-24'})
        invalid_type = self.client.get('/api/reports/sales/', {'sale_type': 'unknown'})

        self.assertEqual(invalid_date.status_code, 400)
        self.assertEqual(invalid_range.status_code, 400)
        self.assertEqual(invalid_type.status_code, 400)

    def test_legacy_or_partially_uncosted_sales_are_not_counted_as_zero_profit(self):
        uncosted = Sale.objects.create(
            transaction_id='REPORT-OLD-001', total_amount=Decimal('7.00'), payment_method='Cash',
        )
        SaleItem.objects.create(
            sale=uncosted, drug=self.drug, quantity=1,
            unit_price=Decimal('7.00'), subtotal=Decimal('7.00'), unit_cost=None,
        )
        response = self.client.get('/api/reports/sales/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['summary']['uncosted_sales'], 1)
        self.assertEqual(response.data['summary']['costed_sales'], 2)
        old_row = next(row for row in response.data['sales'] if row['transaction_id'] == 'REPORT-OLD-001')
        self.assertFalse(old_row['cost_complete'])
        self.assertIsNone(old_row['gross_profit'])
        self.assertEqual(response.data['summary']['gross_profit'], '12.00')


class CostPrivacyAndSnapshotTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name='Cost Permission', type='Pharmacy')
        self.drug = Drug.objects.create(
            name='Snapshot drug', dosage='5mg', form='Capsule', category_obj=self.category,
            unit_price=Decimal('10.00'), unit_cost=Decimal('4.00'), stock=20,
        )
        self.product = Product.objects.create(
            name='Snapshot product', unit_price=Decimal('5.00'), unit_cost=Decimal('1.50'), stock=20,
        )

    def test_non_admin_cannot_read_or_change_costs(self):
        staff_user = User.objects.create_user(username='cost-staff', password='pass', is_staff=True)
        Staff.objects.create(
            full_name='Cost Staff', role='Sales Rep', department='Sales',
            employee_id='COST-STAFF', user=staff_user,
        )
        self.client.force_authenticate(user=staff_user)

        drugs = self.client.get('/api/drugs/')
        self.assertEqual(drugs.status_code, 200)
        drug_data = next(row for row in drugs.data if row['id'] == self.drug.id)
        self.assertNotIn('unit_cost', drug_data)
        update = self.client.patch(f'/api/drugs/{self.drug.id}/', {'unit_cost': '0.01', 'unit_price': '1.00'})
        self.assertEqual(update.status_code, 200)
        self.drug.refresh_from_db()
        self.assertEqual(self.drug.unit_cost, Decimal('4.00'))
        self.assertEqual(self.drug.unit_price, Decimal('10.00'))

        report = self.client.get('/api/reports/sales/')
        self.assertEqual(report.status_code, 200)
        self.assertFalse(report.data['include_profit'])
        self.assertNotIn('gross_profit', report.data['summary'])

    def test_checkout_snapshots_cost_from_catalog_not_client_data_for_both_pos_types(self):
        staff_user = User.objects.create_user(username='snapshot-attendant', password='pass', is_staff=True)
        staff = Staff.objects.create(
            full_name='Snapshot Attendant', role='Sales Attendant', department='Sales',
            employee_id='SNAPSHOT-ATTENDANT', user=staff_user,
        )
        self.client.force_authenticate(user=staff_user)

        pharmacy_response = self.client.post('/api/sales/', {
            'transaction_id': 'SNAPSHOT-PH-001', 'total_amount': '10.50', 'payment_method': 'Cash',
            'items': [{'drug': self.drug.id, 'quantity': 1, 'unit_price': '1.00', 'subtotal': '1.00', 'unit_cost': '0.00'}],
        }, format='json')
        market_response = self.client.post('/api/supermarket-sales/', {
            'transaction_id': 'SNAPSHOT-MK-001', 'total_amount': '5.25', 'payment_method': 'Cash',
            'items': [{'product': self.product.id, 'quantity': 1, 'unit_price': '1.00', 'subtotal': '1.00', 'unit_cost': '0.00'}],
        }, format='json')

        self.assertEqual(pharmacy_response.status_code, 201, pharmacy_response.data)
        self.assertEqual(market_response.status_code, 201, market_response.data)
        pharmacy_line = self.drug.saleitem_set.get(sale_id=pharmacy_response.data['id'])
        market_line = self.product.supermarketsaleitem_set.get(sale_id=market_response.data['id'])
        self.assertEqual(pharmacy_line.unit_cost, Decimal('4.00'))
        self.assertEqual(market_line.unit_cost, Decimal('1.50'))
        self.assertEqual(pharmacy_line.unit_price, Decimal('10.00'))
        self.assertEqual(market_line.unit_price, Decimal('5.00'))
        self.assertNotIn('unit_cost', pharmacy_response.data['items'][0])
        self.assertNotIn('unit_cost', market_response.data['items'][0])
