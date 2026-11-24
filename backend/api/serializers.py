from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Category, Drug, Staff, Customer, Prescription, PrescriptionItem, Sale, SaleItem, SaleReturn, Product, SupermarketSale, SupermarketSaleItem, SystemSettings, Expense

SALES_STAFF_ROLE_MARKERS = ('sales rep', 'sales-rep', 'sales attendant', 'sales-attendant', 'cashier', 'attendant', 'attendance')

def is_sales_staff(staff):
    role = str(getattr(staff, 'role', '') or '').strip().lower().replace('_', ' ')
    return any(marker in role for marker in SALES_STAFF_ROLE_MARKERS)

def is_admin_role(staff):
    role = str(getattr(staff, 'role', '') or '').strip().lower()
    return any(marker in role for marker in ('admin', 'administrator', 'manager', 'director'))

def request_staff_record(serializer):
    user = getattr(serializer.context.get('request'), 'user', None)
    if not user or not getattr(user, 'is_authenticated', False):
        return None
    staff = Staff.objects.filter(user=user).first()
    if not staff:
        staff = Staff.objects.filter(employee_id__iexact=user.username).first()
    if not staff and user.email:
        staff = Staff.objects.filter(email__iexact=user.email).first()
    return staff

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        raw_username = (attrs.get('username') or '').strip()

        # Flexible lookup: allow login by Username, Email, or Employee ID (case-insensitive)
        user = User.objects.filter(username__iexact=raw_username).first()
        if not user:
            user = User.objects.filter(email__iexact=raw_username).first()
        if not user:
            staff = Staff.objects.filter(employee_id__iexact=raw_username).first()
            if staff and staff.employee_id:
                user = User.objects.filter(username__iexact=staff.employee_id.lower()).first()

        if user:
            attrs['username'] = user.username  # Standardize to actual User.username

        data = super().validate(attrs)
        user = self.user

        role = "Admin" if user.is_superuser else "Staff"
        department = "Management" if user.is_superuser else "General"
        full_name = user.get_full_name() or user.username

        staff = None
        try:
            staff = Staff.objects.filter(user=user).first()
            if not staff:
                staff = Staff.objects.filter(employee_id__iexact=user.username).first()
            if not staff and user.email:
                staff = Staff.objects.filter(email__iexact=user.email).first()

            if staff:
                role = staff.role or role
                department = staff.department or department
                full_name = staff.full_name or full_name
        except Exception:
            pass

        is_admin = bool(user.is_superuser or (staff and is_admin_role(staff)) or (role and str(role).lower() in ['admin', 'administrator', 'manager', 'director']))

        data['username'] = user.username
        data['role'] = role
        data['department'] = department
        data['full_name'] = full_name
        data['is_admin'] = is_admin
        data['is_staff'] = user.is_staff
        return data

class CategorySerializer(serializers.ModelSerializer):
    type = serializers.CharField(max_length=50, required=False, default='Pharmacy', allow_blank=True)

    class Meta:
        model = Category
        fields = '__all__'

    def validate(self, attrs):
        name = attrs.get('name', '').strip() if attrs.get('name') else ''
        cat_type = attrs.get('type')
        if not cat_type or not str(cat_type).strip():
            cat_type = 'Pharmacy'
        else:
            cat_type = str(cat_type).strip()

        if not name:
            raise serializers.ValidationError({'name': 'Category name cannot be empty.'})

        attrs['name'] = name
        attrs['type'] = cat_type

        # Check for duplicate category (case-insensitive) for the same type
        queryset = Category.objects.filter(name__iexact=name, type__iexact=cat_type)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError({'name': f'A category named "{name}" already exists in {cat_type}.'})

        return attrs

class InventoryPricePermissionMixin:
    def _request_is_admin(self):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        return bool(user and user.is_authenticated and (user.is_superuser or is_admin_role(request_staff_record(self))))

class DrugSerializer(InventoryPricePermissionMixin, serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()

    class Meta:
        model = Drug
        fields = '__all__'

    def validate(self, attrs):
        if not self._request_is_admin():
            attrs.pop('unit_price', None)
        return attrs

    def get_category_name(self, obj):
        if obj.category_obj:
            return obj.category_obj.name
        return obj.category or ""

    def validate_barcode(self, value):
        if value is None or (isinstance(value, str) and value.strip() == ""):
            return None
        return value.strip()

    def create(self, validated_data):
        category_obj = validated_data.get('category_obj')
        if category_obj and not validated_data.get('category'):
            validated_data['category'] = category_obj.name
        elif not category_obj and validated_data.get('category'):
            cat = Category.objects.filter(name__iexact=validated_data['category'].strip(), type='Pharmacy').first()
            if cat:
                validated_data['category_obj'] = cat
        return super().create(validated_data)

    def update(self, instance, validated_data):
        category_obj = validated_data.get('category_obj')
        if category_obj:
            validated_data['category'] = category_obj.name
        elif validated_data.get('category'):
            cat = Category.objects.filter(name__iexact=validated_data['category'].strip(), type='Pharmacy').first()
            if cat:
                validated_data['category_obj'] = cat
        return super().update(instance, validated_data)

class StaffSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    phone_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    department = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    username = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    login_username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = Staff
        fields = '__all__'
        read_only_fields = ('user',)

    def validate_email(self, value):
        if value is None or (isinstance(value, str) and value.strip() == ""):
            return None
        return value.strip()

    def _admin_for_request(self):
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        return bool(user and user.is_authenticated and (user.is_superuser or is_admin_role(request_staff_record(self))))

    def _username(self, supplied, staff):
        return (supplied or staff.employee_id or '').strip().lower()

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop('password', None) or 'admin123'
        custom_username = validated_data.pop('username', None)
        staff = Staff.objects.create(**validated_data)
        login_username = self._username(custom_username, staff)
        if not login_username:
            raise serializers.ValidationError({'username': 'A login username or employee ID is required.'})
        if User.objects.filter(username__iexact=login_username).exists():
            raise serializers.ValidationError({'username': 'This username is already assigned to another account.'})
        user = User.objects.create_user(username=login_username, email=staff.email or '', password=password, is_staff=True, is_superuser=is_admin_role(staff))
        staff.user = user
        staff.save(update_fields=['user'])
        return staff

    @transaction.atomic
    def update(self, instance, validated_data):
        old_employee_id = instance.employee_id
        password = validated_data.pop('password', None)
        custom_username = validated_data.pop('username', None)
        staff = super().update(instance, validated_data)
        user = staff.user
        requested_username = (custom_username or '').strip()
        if user is None:
            login_username = self._username(requested_username, staff)
            # Never claim an account by matching an arbitrary email/employee id.
            if User.objects.filter(username__iexact=login_username).exists():
                raise serializers.ValidationError({'username': 'This username is already assigned to another account.'})
            user = User.objects.create_user(username=login_username, email=staff.email or '', password=password or 'admin123', is_staff=True, is_superuser=is_admin_role(staff))
            staff.user = user
            staff.save(update_fields=['user'])
        else:
            old_default_username = (old_employee_id or '').strip().lower()
            if requested_username:
                login_username = self._username(requested_username, staff)
            elif user.username.lower() == old_default_username and staff.employee_id:
                login_username = self._username(staff.employee_id, staff)
            else:
                login_username = user.username
            if login_username and login_username.lower() != user.username.lower():
                if User.objects.exclude(pk=user.pk).filter(username__iexact=login_username).exists():
                    raise serializers.ValidationError({'username': 'This username is already assigned to another account.'})
                user.username = login_username
            user.email = staff.email or ''
            if password:
                user.set_password(password)
            user.is_staff = True
            user.is_superuser = is_admin_role(staff)
            user.save()
        return staff

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'

class PrescriptionItemSerializer(serializers.ModelSerializer):
    drug_name = serializers.ReadOnlyField(source='drug.name')
    drug_dosage = serializers.ReadOnlyField(source='drug.dosage')
    
    class Meta:
        model = PrescriptionItem
        fields = ['id', 'prescription', 'drug', 'drug_name', 'drug_dosage', 'quantity', 'refills', 'directions']

class PrescriptionSerializer(serializers.ModelSerializer):
    items = PrescriptionItemSerializer(many=True, read_only=True)

    class Meta:
        model = Prescription
        fields = '__all__'

class SaleItemSerializer(serializers.ModelSerializer):
    drug_name = serializers.ReadOnlyField(source='drug.name')
    class Meta:
        model = SaleItem
        fields = ['id', 'sale', 'drug', 'drug_name', 'quantity', 'unit_price', 'subtotal']

class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    staff_name = serializers.ReadOnlyField(source='staff.full_name')
    customer_name = serializers.SerializerMethodField()
    customer_phone = serializers.ReadOnlyField(source='customer.phone_number')
    customer_address = serializers.ReadOnlyField(source='customer.address')

    def get_customer_name(self, obj):
        return f'{obj.customer.first_name} {obj.customer.last_name}'.strip() if obj.customer else 'Walk-in Customer'

    class Meta:
        model = Sale
        fields = ['id', 'transaction_id', 'customer', 'customer_name', 'customer_phone', 'customer_address', 'total_amount', 'payment_method', 'staff', 'staff_name', 'created_at', 'items']

class SaleReturnSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleReturn
        fields = '__all__'

class ProductSerializer(InventoryPricePermissionMixin, serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = '__all__'

    def validate(self, attrs):
        if not self._request_is_admin():
            attrs.pop('unit_price', None)
        return attrs

    def get_category_name(self, obj):
        if obj.category_obj:
            return obj.category_obj.name
        return obj.category or ""

    def validate_barcode(self, value):
        if value is None or (isinstance(value, str) and value.strip() == ""):
            return None
        return value.strip()

    def create(self, validated_data):
        category_obj = validated_data.get('category_obj')
        if category_obj and not validated_data.get('category'):
            validated_data['category'] = category_obj.name
        elif not category_obj and validated_data.get('category'):
            cat = Category.objects.filter(name__iexact=validated_data['category'].strip(), type='Supermarket').first()
            if cat:
                validated_data['category_obj'] = cat
        return super().create(validated_data)

    def update(self, instance, validated_data):
        category_obj = validated_data.get('category_obj')
        if category_obj:
            validated_data['category'] = category_obj.name
        elif validated_data.get('category'):
            cat = Category.objects.filter(name__iexact=validated_data['category'].strip(), type='Supermarket').first()
            if cat:
                validated_data['category_obj'] = cat
        return super().update(instance, validated_data)

class SupermarketSaleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.ReadOnlyField(source='product.name')
    class Meta:
        model = SupermarketSaleItem
        fields = ['id', 'sale', 'product', 'product_name', 'quantity', 'unit_price', 'subtotal']

class SupermarketSaleSerializer(serializers.ModelSerializer):
    items = SupermarketSaleItemSerializer(many=True, read_only=True)
    staff_name = serializers.ReadOnlyField(source='staff.full_name')
    customer_name = serializers.SerializerMethodField()
    customer_phone = serializers.ReadOnlyField(source='customer.phone_number')
    customer_address = serializers.ReadOnlyField(source='customer.address')

    def get_customer_name(self, obj):
        return f'{obj.customer.first_name} {obj.customer.last_name}'.strip() if obj.customer else 'Walk-in Customer'

    class Meta:
        model = SupermarketSale
        fields = ['id', 'transaction_id', 'customer', 'customer_name', 'customer_phone', 'customer_address', 'total_amount', 'payment_method', 'staff', 'staff_name', 'created_at', 'items']

class SystemSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSettings
        fields = '__all__'

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def update(self, instance, validated_data):
        if 'password' in validated_data and validated_data['password']:
            password = validated_data.pop('password')
            instance.set_password(password)
        elif 'password' in validated_data:
            validated_data.pop('password')
        return super().update(instance, validated_data)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'password', 'is_staff']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            is_staff=True # Admins are staff
        )
        return user

    def update(self, instance, validated_data):
        if 'password' in validated_data and validated_data['password']:
            password = validated_data.pop('password')
            instance.set_password(password)
        elif 'password' in validated_data:
            validated_data.pop('password')
        return super().update(instance, validated_data)

class ExpenseSerializer(serializers.ModelSerializer):
    staff_name = serializers.ReadOnlyField(source='staff.full_name')
    class Meta:
        model = Expense
        fields = '__all__'
