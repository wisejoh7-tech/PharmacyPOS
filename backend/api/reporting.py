from collections import defaultdict
from datetime import date
from decimal import Decimal

from django.db.models import Q
from django.utils import timezone

from .models import Sale, SupermarketSale

ZERO = Decimal('0.00')


def _money(value):
    return f'{(value or ZERO):.2f}'


def _parse_date(value, field_name):
    if not value:
        return None
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        raise ValueError(f'{field_name} must be a valid date in YYYY-MM-DD format.')


def _filtered_queryset(model, product_relation, params, start_date, end_date):
    queryset = model.objects.select_related('customer', 'staff').prefetch_related('items__' + product_relation)
    if start_date:
        queryset = queryset.filter(created_at__date__gte=start_date)
    if end_date:
        queryset = queryset.filter(created_at__date__lte=end_date)
    payment_method = params.get('payment_method', '').strip()
    if payment_method:
        queryset = queryset.filter(payment_method__iexact=payment_method)
    staff = params.get('staff', '').strip()
    if staff:
        queryset = queryset.filter(staff__full_name__icontains=staff)
    search = params.get('search', '').strip()
    if search:
        queryset = queryset.filter(
            Q(transaction_id__icontains=search)
            | Q(customer__first_name__icontains=search)
            | Q(customer__last_name__icontains=search)
            | Q(staff__full_name__icontains=search)
            | Q(**{f'items__{product_relation}__name__icontains': search})
        )
    product = params.get('product', '').strip()
    if product:
        queryset = queryset.filter(**{f'items__{product_relation}__name__icontains': product})
    return queryset.distinct().order_by('-created_at', '-id')


def build_sales_report(params, include_profit):
    start_date = _parse_date(params.get('start_date'), 'start_date')
    end_date = _parse_date(params.get('end_date'), 'end_date')
    if start_date and end_date and start_date > end_date:
        raise ValueError('start_date cannot be later than end_date.')

    sale_type = params.get('sale_type', 'all').strip().lower() or 'all'
    if sale_type not in {'all', 'pharmacy', 'supermarket'}:
        raise ValueError('sale_type must be all, pharmacy, or supermarket.')

    datasets = []
    if sale_type in {'all', 'pharmacy'}:
        datasets.append(('pharmacy', _filtered_queryset(Sale, 'drug', params, start_date, end_date)))
    if sale_type in {'all', 'supermarket'}:
        datasets.append(('supermarket', _filtered_queryset(SupermarketSale, 'product', params, start_date, end_date)))

    rows = []
    by_type = defaultdict(lambda: {'transactions': 0, 'total_amount': ZERO, 'net_sales': ZERO})
    by_payment = defaultdict(lambda: {'transactions': 0, 'total_amount': ZERO, 'net_sales': ZERO})
    by_staff = defaultdict(lambda: {'transactions': 0, 'total_amount': ZERO, 'net_sales': ZERO})
    by_product = defaultdict(lambda: {
        'quantity': 0, 'sales_subtotal': ZERO, 'cost': ZERO, 'cost_complete': True,
        'net_quantity': 0,
    })
    by_day = defaultdict(lambda: {'transactions': 0, 'total_amount': ZERO, 'net_sales': ZERO, 'gross_profit': ZERO, 'profit_sales': ZERO})

    totals = {
        'transactions': 0, 'total_amount': ZERO, 'sales_subtotal': ZERO,
        'refunds': ZERO, 'net_sales': ZERO, 'units_sold': 0,
        'costed_sales': 0, 'uncosted_sales': 0, 'costed_net_sales': ZERO,
        'cost_of_goods_sold': ZERO, 'gross_profit': ZERO,
    }

    for kind, queryset in datasets:
        for sale in queryset:
            items = list(sale.items.all())
            refunds = list(sale.returns.all()) if kind == 'pharmacy' else []
            refund_total = sum((item.refund_amount or ZERO for item in refunds), ZERO)
            sale_subtotal = sum((item.subtotal or ZERO for item in items), ZERO)
            total_amount = sale.total_amount or ZERO
            net_sales = sale_subtotal - refund_total
            total_units = sum((item.quantity or 0 for item in items), 0)
            cost_complete = bool(items) and all(item.unit_cost is not None for item in items)

            returned_by_product = defaultdict(int)
            for returned in refunds:
                if returned.drug_id:
                    returned_by_product[returned.drug_id] += max(returned.quantity or 0, 0)

            row_items = []
            sale_cogs = ZERO
            for line in items:
                product_obj = getattr(line, 'drug', None) if kind == 'pharmacy' else getattr(line, 'product', None)
                name = product_obj.name if product_obj else 'Deleted item'
                quantity = line.quantity or 0
                returned_quantity = 0
                product_key = (kind, name)
                if kind == 'pharmacy' and line.drug_id:
                    returned_quantity = min(quantity, returned_by_product[line.drug_id])
                    returned_by_product[line.drug_id] -= returned_quantity
                net_quantity = quantity - returned_quantity
                line_subtotal = line.subtotal or ZERO
                line_cost = line.unit_cost
                if line_cost is not None:
                    line_cost_total = line_cost * net_quantity
                    sale_cogs += line_cost_total
                else:
                    line_cost_total = None
                aggregate = by_product[product_key]
                aggregate['quantity'] += quantity
                aggregate['net_quantity'] += net_quantity
                aggregate['sales_subtotal'] += line_subtotal
                if line_cost is None:
                    aggregate['cost_complete'] = False
                else:
                    aggregate['cost'] += line_cost_total
                item_data = {
                    'name': name,
                    'quantity': quantity,
                    'unit_price': _money(line.unit_price),
                    'subtotal': _money(line_subtotal),
                }
                if include_profit:
                    item_data['unit_cost'] = _money(line_cost) if line_cost is not None else None
                row_items.append(item_data)

            if kind == 'pharmacy':
                sale_date = timezone.localtime(sale.created_at).date() if timezone.is_aware(sale.created_at) else sale.created_at.date()
            else:
                sale_date = timezone.localtime(sale.created_at).date() if timezone.is_aware(sale.created_at) else sale.created_at.date()
            staff_name = sale.staff.full_name if sale.staff else 'Unassigned'
            customer_name = f'{sale.customer.first_name} {sale.customer.last_name}'.strip() if sale.customer else 'Walk-in Customer'
            row = {
                'id': sale.id,
                'transaction_id': sale.transaction_id,
                'sale_type': kind,
                'created_at': sale.created_at.isoformat(),
                'customer_name': customer_name,
                'staff_name': staff_name,
                'staff_id': sale.staff_id,
                'payment_method': sale.payment_method,
                'total_amount': _money(total_amount),
                'sales_subtotal': _money(sale_subtotal),
                'refund_amount': _money(refund_total),
                'net_sales': _money(net_sales),
                'quantity': total_units,
                'items': row_items,
            }
            if include_profit:
                row.update({
                    'cost_complete': cost_complete,
                    'cost_of_goods_sold': _money(sale_cogs) if cost_complete else None,
                    'gross_profit': _money(net_sales - sale_cogs) if cost_complete else None,
                })
            rows.append(row)

            totals['transactions'] += 1
            totals['total_amount'] += total_amount
            totals['sales_subtotal'] += sale_subtotal
            totals['refunds'] += refund_total
            totals['net_sales'] += net_sales
            totals['units_sold'] += total_units
            by_type[kind]['transactions'] += 1
            by_type[kind]['total_amount'] += total_amount
            by_type[kind]['net_sales'] += net_sales
            payment = sale.payment_method or 'Unspecified'
            by_payment[payment]['transactions'] += 1
            by_payment[payment]['total_amount'] += total_amount
            by_payment[payment]['net_sales'] += net_sales
            by_staff[staff_name]['transactions'] += 1
            by_staff[staff_name]['total_amount'] += total_amount
            by_staff[staff_name]['net_sales'] += net_sales
            day_key = sale_date.isoformat()
            by_day[day_key]['transactions'] += 1
            by_day[day_key]['total_amount'] += total_amount
            by_day[day_key]['net_sales'] += net_sales

            if include_profit:
                if cost_complete:
                    profit = net_sales - sale_cogs
                    totals['costed_sales'] += 1
                    totals['costed_net_sales'] += net_sales
                    totals['cost_of_goods_sold'] += sale_cogs
                    totals['gross_profit'] += profit
                    by_day[day_key]['gross_profit'] += profit
                    by_day[day_key]['profit_sales'] += net_sales
                else:
                    totals['uncosted_sales'] += 1

    if include_profit:
        for product_key, aggregate in by_product.items():
            if aggregate['cost_complete']:
                aggregate['gross_profit'] = aggregate['sales_subtotal'] - aggregate['cost']

    summary = {
        'transaction_count': totals['transactions'],
        'total_amount': _money(totals['total_amount']),
        'sales_subtotal': _money(totals['sales_subtotal']),
        'refunds': _money(totals['refunds']),
        'net_sales': _money(totals['net_sales']),
        'units_sold': totals['units_sold'],
        'average_transaction_value': _money(totals['total_amount'] / totals['transactions']) if totals['transactions'] else _money(ZERO),
    }
    if include_profit:
        summary.update({
            'costed_sales': totals['costed_sales'],
            'uncosted_sales': totals['uncosted_sales'],
            'cost_coverage_percent': round((totals['costed_sales'] / totals['transactions']) * 100, 1) if totals['transactions'] else 0,
            'costed_net_sales': _money(totals['costed_net_sales']),
            'cost_of_goods_sold': _money(totals['cost_of_goods_sold']),
            'gross_profit': _money(totals['gross_profit']),
            'gross_margin_percent': round((totals['gross_profit'] / totals['costed_net_sales']) * 100, 2) if totals['costed_net_sales'] else None,
        })

    def breakdown(source, name_key):
        return [
            {
                name_key: key,
                'transactions': data['transactions'],
                'total_amount': _money(data['total_amount']),
                'net_sales': _money(data['net_sales']),
            }
            for key, data in sorted(source.items(), key=lambda pair: pair[1]['total_amount'], reverse=True)
        ]

    product_rows = []
    for (kind, name), data in sorted(by_product.items(), key=lambda pair: pair[1]['sales_subtotal'], reverse=True):
        product_row = {
            'name': name,
            'sale_type': kind,
            'quantity_sold': data['quantity'],
            'quantity_returned': data['quantity'] - data['net_quantity'],
            'net_quantity': data['net_quantity'],
            'sales_subtotal': _money(data['sales_subtotal']),
        }
        if include_profit:
            product_row.update({
                'cost_complete': data['cost_complete'],
                'cost_of_goods_sold': _money(data['cost']) if data['cost_complete'] else None,
                'gross_profit': _money(data.get('gross_profit', ZERO)) if data['cost_complete'] else None,
            })
        product_rows.append(product_row)

    trend_rows = []
    for day, data in sorted(by_day.items()):
        trend_row = {
            'date': day,
            'transactions': data['transactions'],
            'total_amount': _money(data['total_amount']),
            'net_sales': _money(data['net_sales']),
        }
        if include_profit:
            trend_row['gross_profit'] = _money(data['gross_profit'])
            trend_row['costed_net_sales'] = _money(data['profit_sales'])
        trend_rows.append(trend_row)

    return {
        'filters': {
            'start_date': start_date.isoformat() if start_date else None,
            'end_date': end_date.isoformat() if end_date else None,
            'sale_type': sale_type,
            'payment_method': params.get('payment_method', '').strip(),
            'staff': params.get('staff', '').strip(),
            'product': params.get('product', '').strip(),
            'search': params.get('search', '').strip(),
        },
        'include_profit': include_profit,
        'summary': summary,
        'sales': rows,
        'by_type': breakdown(by_type, 'sale_type'),
        'by_payment_method': breakdown(by_payment, 'payment_method'),
        'by_staff': breakdown(by_staff, 'staff_name'),
        'top_products': product_rows,
        'trend': trend_rows,
    }
