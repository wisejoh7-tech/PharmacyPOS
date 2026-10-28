from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=50, default='Pharmacy', blank=True) # 'Pharmacy' or 'Supermarket'

    def __str__(self):
        return f"{self.name} ({self.type})"

class Drug(models.Model):
    name = models.CharField(max_length=255)
    generic_name = models.CharField(max_length=255, blank=True, null=True)
    category = models.CharField(max_length=100, null=True, blank=True)
    category_obj = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    dosage = models.CharField(max_length=50)
    form = models.CharField(max_length=50)
    expiry_date = models.DateField(blank=True, null=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=10)
    barcode = models.CharField(max_length=100, blank=True, null=True, unique=True)
    stock_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"{self.name} ({self.dosage})"

class Staff(models.Model):
    full_name = models.CharField(max_length=255)
    email = models.EmailField(unique=True, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    role = models.CharField(max_length=100)
    department = models.CharField(max_length=100, blank=True, null=True)
    employee_id = models.CharField(max_length=50, unique=True)
    photo = models.TextField(blank=True, null=True) # Storing data URL for simplicity
    status = models.CharField(max_length=50, default='Active')

    def __str__(self):
        return self.full_name

class Customer(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    customer_id = models.CharField(max_length=50, unique=True)
    phone_number = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    allergies = models.TextField(blank=True, null=True)
    chronic_conditions = models.TextField(blank=True, null=True)
    medications = models.TextField(blank=True, null=True)
    photo = models.TextField(blank=True, null=True) # Storing data URL for simplicity
    status = models.CharField(max_length=50, default='Active')

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Prescription(models.Model):
    prescription_id = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, related_name='prescriptions')
    prescribing_doctor = models.CharField(max_length=255, blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.prescription_id

class PrescriptionItem(models.Model):
    prescription = models.ForeignKey(Prescription, on_delete=models.CASCADE, related_name='items')
    drug = models.ForeignKey(Drug, on_delete=models.SET_NULL, null=True)
    quantity = models.IntegerField()
    refills = models.IntegerField(default=0)
    directions = models.TextField()

class Sale(models.Model):
    transaction_id = models.CharField(max_length=50, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=50) # Cash, Card
    staff = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True, related_name='sales')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.transaction_id

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    drug = models.ForeignKey(Drug, on_delete=models.SET_NULL, null=True)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        drug_name = self.drug.name if self.drug else "Unknown Drug"
        return f"{drug_name} x {self.quantity}"

class SaleReturn(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='returns')
    drug = models.ForeignKey(Drug, on_delete=models.SET_NULL, null=True)
    quantity = models.IntegerField()
    reason = models.TextField()
    refund_amount = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Return for {self.sale.transaction_id}"

class Product(models.Model):
    name = models.CharField(max_length=255)
    category = models.CharField(max_length=100, null=True, blank=True)
    category_obj = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock = models.IntegerField(default=0)
    reorder_level = models.IntegerField(default=10)
    barcode = models.CharField(max_length=100, blank=True, null=True, unique=True)
    stock_date = models.DateField(null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)

    def __str__(self):
        return self.name

class SupermarketSale(models.Model):
    transaction_id = models.CharField(max_length=50, unique=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=50) # Cash, Card
    staff = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True, related_name='supermarket_sales')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.transaction_id

class SupermarketSaleItem(models.Model):
    sale = models.ForeignKey(SupermarketSale, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    quantity = models.IntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)

    def __str__(self):
        product_name = self.product.name if self.product else "Unknown Product"
        return f"{product_name} x {self.quantity}"

class SystemSettings(models.Model):
    shop_name = models.CharField(max_length=255, default='New Light Medicine and Store')
    location = models.CharField(max_length=255, default="St. Mary's")
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    currency = models.CharField(max_length=10, default='NGN')
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    low_stock_threshold = models.IntegerField(default=10)
    
    # Notification Preferences
    notify_new_swap = models.BooleanField(default=True)
    notify_swap_approval = models.BooleanField(default=True)
    notify_low_stock = models.BooleanField(default=True)
    notify_prescription_review = models.BooleanField(default=True)
    notify_system_updates = models.BooleanField(default=True)
    notification_method = models.CharField(max_length=20, default='push') # 'push', 'email', 'sms'
    
    def __str__(self):
        return self.shop_name

from django.utils import timezone

class Expense(models.Model):
    category = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.TextField(blank=True, null=True)
    date = models.DateField(default=timezone.now)
    staff = models.ForeignKey(Staff, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.category}: {self.amount}"
