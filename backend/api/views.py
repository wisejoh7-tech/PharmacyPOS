from django.contrib.auth.models import User
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action, api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db.models import Sum, Count, F
from .models import Category, Drug, Staff, Customer, Prescription, PrescriptionItem, Sale, SaleItem, SaleReturn, Product, SupermarketSale, SupermarketSaleItem, SystemSettings, Expense
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import (
    CategorySerializer, DrugSerializer, StaffSerializer, CustomerSerializer,
    PrescriptionSerializer, SaleSerializer, SaleReturnSerializer,
    ProductSerializer, SupermarketSaleSerializer, SystemSettingsSerializer, UserProfileSerializer, UserSerializer, ExpenseSerializer,
    CustomTokenObtainPairSerializer
)

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

class DrugViewSet(viewsets.ModelViewSet):
    queryset = Drug.objects.all()
    serializer_class = DrugSerializer

class StaffViewSet(viewsets.ModelViewSet):
    queryset = Staff.objects.all()
    serializer_class = StaffSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        username = instance.employee_id.lower() if instance.employee_id else None
        email = instance.email

        user = None
        if username:
            user = User.objects.filter(username=username).first()
        if not user and email:
            user = User.objects.filter(email__iexact=email).first()

        if user and not user.is_superuser:
            user.delete()

        return super().destroy(request, *args, **kwargs)

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

class PrescriptionViewSet(viewsets.ModelViewSet):
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer

    def get_queryset(self):
        queryset = Prescription.objects.all().order_by('-created_at')
        customer_id = self.request.query_params.get('customer')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        return queryset

    def create(self, request, *args, **kwargs):
        with transaction.atomic():
            data = request.data
            items_data = data.pop('items', [])
            
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            prescription = serializer.save()

            for item in items_data:
                # Validate drug exists
                if not Drug.objects.filter(id=item['drug']).exists():
                    raise serializers.ValidationError(f"Drug with ID {item['drug']} does not exist.")

                PrescriptionItem.objects.create(
                    prescription=prescription,
                    drug_id=item['drug'],
                    quantity=item['quantity'],
                    directions=item['directions']
                )

            # Re-serialize to include items in the response
            full_serializer = self.get_serializer(prescription)
            return Response(full_serializer.data, status=status.HTTP_201_CREATED)

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer

    def create(self, request, *args, **kwargs):
        # Implement atomic transaction for sale and stock update
        with transaction.atomic():
            data = request.data
            items_data = data.pop('items', [])
            staff_id = data.get('staff')
            
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            sale = serializer.save()

            if staff_id:
                sale.staff_id = staff_id
                sale.save()

            for item in items_data:
                try:
                    drug = Drug.objects.get(id=item['drug'])
                except Drug.DoesNotExist:
                    raise serializers.ValidationError(f"Medication ID {item['drug']} not found in inventory.")
                
                if drug.stock < item['quantity']:
                    raise serializers.ValidationError(f"Insufficient stock for {drug.name}. Requested: {item['quantity']}, Available: {drug.stock}")
                
                SaleItem.objects.create(
                    sale=sale,
                    drug=drug,
                    quantity=item['quantity'],
                    unit_price=item['unit_price'],
                    subtotal=item['subtotal']
                )
                
                # Update stock
                drug.stock -= item['quantity']
                drug.save()

            # Re-serialize to include items in the response
            full_serializer = self.get_serializer(sale)
            return Response(full_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='dashboard-stats')
    def dashboard_stats(self, request):
        total_revenue = Sale.objects.aggregate(total=Sum('total_amount'))['total'] or 0
        total_transactions = Sale.objects.count()
        low_stock_count = Drug.objects.filter(stock__lte=F('reorder_level')).count()
        
        return Response({
            'total_revenue': total_revenue,
            'total_transactions': total_transactions,
            'low_stock_count': low_stock_count,
        })

    @action(detail=True, methods=['get'], url_path='sales-stats')
    def sales_stats(self, request, pk=None):
        """Get sales statistics for a specific staff member"""
        staff = get_object_or_404(Staff, pk=pk)
        sales = Sale.objects.filter(staff=staff)
        
        total_revenue = sales.aggregate(total=Sum('total_amount'))['total'] or 0
        customer_count = sales.values('customer').distinct().count()
        transaction_count = sales.count()
        
        return Response({
            'staff_name': staff.full_name,
            'total_revenue': total_revenue,
            'customer_count': customer_count,
            'transaction_count': transaction_count
        })

class SaleReturnViewSet(viewsets.ModelViewSet):
    queryset = SaleReturn.objects.all()
    serializer_class = SaleReturnSerializer

    def create(self, request, *args, **kwargs):
        with transaction.atomic():
            data = request.data
            drug_id = data.get('drug')
            quantity = int(data.get('quantity', 0))
            
            # Create the return record
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            serializer.save()

            # Update stock: put items back into inventory
            drug = get_object_or_404(Drug, id=drug_id)
            drug.stock += quantity
            drug.save()

            return Response(serializer.data, status=status.HTTP_201_CREATED)

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

class SystemSettingsViewSet(viewsets.ModelViewSet):
    queryset = SystemSettings.objects.all()
    serializer_class = SystemSettingsSerializer

    def get_authenticators(self):
        if getattr(self, 'action', None) in ['list', 'retrieve']:
            return []
        return super().get_authenticators()

    def get_permissions(self):
        if getattr(self, 'action', None) in ['list', 'retrieve']:
            return [AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        try:
            if not SystemSettings.objects.exists():
                SystemSettings.objects.create(shop_name='New Light Medicine and Store', location="St. Mary's")
            return SystemSettings.objects.all()
        except Exception:
            return SystemSettings.objects.none()

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_staff=True)
    serializer_class = UserSerializer

    def get_queryset(self):
        # Only show staff/admin users
        return User.objects.filter(is_staff=True)

@api_view(['POST'])
def update_profile(request):
    user = request.user
    serializer = UserProfileSerializer(user, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response({'message': 'Admin profile updated successfully'})

class SupermarketSaleViewSet(viewsets.ModelViewSet):
    queryset = SupermarketSale.objects.all()
    serializer_class = SupermarketSaleSerializer

    def create(self, request, *args, **kwargs):
        with transaction.atomic():
            data = request.data
            items_data = data.pop('items', [])
            staff_id = data.get('staff')
            
            serializer = self.get_serializer(data=data)
            serializer.is_valid(raise_exception=True)
            sale = serializer.save()

            if staff_id:
                sale.staff_id = staff_id
                sale.save()

            for item in items_data:
                try:
                    product = Product.objects.get(id=item['product'])
                except Product.DoesNotExist:
                    raise serializers.ValidationError(f"Product ID {item['product']} not found in supermarket inventory.")
                
                if product.stock < item['quantity']:
                    raise serializers.ValidationError(f"Insufficient stock for {product.name}. Requested: {item['quantity']}, Available: {product.stock}")
                
                SupermarketSaleItem.objects.create(
                    sale=sale,
                    product=product,
                    quantity=item['quantity'],
                    unit_price=item['unit_price'],
                    subtotal=item['subtotal']
                )
                
                # Update stock
                product.stock -= item['quantity']
                product.save()

            # Re-serialize to include items in the response
            full_serializer = self.get_serializer(sale)
            return Response(full_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='dashboard-stats')
    def dashboard_stats(self, request):
        total_revenue = SupermarketSale.objects.aggregate(total=Sum('total_amount'))['total'] or 0
        total_transactions = SupermarketSale.objects.count()
        low_stock_count = Product.objects.filter(stock__lte=F('reorder_level')).count()
        
        return Response({
            'total_revenue': total_revenue,
            'total_transactions': total_transactions,
            'low_stock_count': low_stock_count,
        })

class ReportsView(viewsets.ViewSet):
    def list(self, request):
        return Response({"message": "Reporting API Active"})

    @action(detail=False, methods=['get'], url_path='dashboard-stats')
    def dashboard_stats(self, request):
        total_revenue = Sale.objects.aggregate(total=Sum('total_amount'))['total'] or 0
        total_transactions = Sale.objects.count()
        low_stock_count = Drug.objects.filter(stock__lte=F('reorder_level')).count()
        
        return Response({
            'total_revenue': total_revenue,
            'total_transactions': total_transactions,
            'low_stock_count': low_stock_count,
        })

    @action(detail=False, methods=['get'], url_path='sales')
    def sales_report(self, request):
        sales = Sale.objects.all().order_by('-created_at')
        serializer = SaleSerializer(sales, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='inventory-turnover')
    def inventory_turnover(self, request):
        drugs = Drug.objects.all()
        serializer = DrugSerializer(drugs, many=True)
        return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
@authentication_classes([])
def reset_password(request):
    identifier = (request.data.get('username') or request.data.get('identifier') or '').strip().lower()
    new_password = request.data.get('password', 'admin123').strip()
    
    if not identifier:
        return Response({'error': 'Username, Email or Employee ID is required'}, status=status.HTTP_400_BAD_REQUEST)

    # Look up by username or email
    user = User.objects.filter(username__iexact=identifier).first()
    if not user:
        user = User.objects.filter(email__iexact=identifier).first()

    # Look up by staff record
    if not user:
        staff = Staff.objects.filter(employee_id__iexact=identifier).first()
        if staff and staff.employee_id:
            user = User.objects.filter(username__iexact=staff.employee_id.lower()).first()

    if user:
        user.set_password(new_password or 'admin123')
        user.save()
        return Response({
            'message': f'Password for {user.username} has been successfully reset!',
            'username': user.username,
            'default_password': new_password or 'admin123'
        }, status=status.HTTP_200_OK)

    return Response({'error': f'No account found matching "{identifier}". Please verify your details.'}, status=status.HTTP_404_NOT_FOUND)
@api_view(['GET'])
@permission_classes([AllowAny])
@authentication_classes([])
def health_check(request):
    return Response({"status": "healthy", "version": "1.0.2", "message": "Pharmacy API is running"})

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by('-date')
    serializer_class = ExpenseSerializer

    @action(detail=False, methods=['get'], url_path='financial-summary')
    def financial_summary(self, request):
        # Revenue from Pharmacy
        pharmacy_revenue = Sale.objects.aggregate(total=Sum('total_amount'))['total'] or 0
        # Revenue from Supermarket
        supermarket_revenue = SupermarketSale.objects.aggregate(total=Sum('total_amount'))['total'] or 0

        total_revenue = pharmacy_revenue + supermarket_revenue
        total_expenses = Expense.objects.aggregate(total=Sum('amount'))['total'] or 0

        # Sales Count
        pharmacy_sales_count = Sale.objects.count()
        supermarket_sales_count = SupermarketSale.objects.count()
        total_sales_count = pharmacy_sales_count + supermarket_sales_count

        profit = total_revenue - total_expenses
        balance = profit
        
        return Response({
            'total_revenue': float(total_revenue),
            'total_expenses': float(total_expenses),
            'net_profit': float(profit),
            'balance': float(balance),
            'revenue': float(total_revenue),
            'expenses': float(total_expenses),
            'profit': float(profit),
            'sales_count': total_sales_count
        })
