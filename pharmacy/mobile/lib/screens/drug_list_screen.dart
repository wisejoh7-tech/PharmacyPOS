import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/drug_provider.dart';

class DrugListScreen extends StatefulWidget {
  const DrugListScreen({super.key});

  @override
  State<DrugListScreen> createState() => _DrugListScreenState();
}

class _DrugListScreenState extends State<DrugListScreen> {
  @override
  void initState() {
    super.initState();
    Future.delayed(Duration.zero, () {
      context.read<DrugProvider>().fetchDrugs();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Pharmacy Inventory'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => context.read<DrugProvider>().fetchDrugs(),
          ),
        ],
      ),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: const BoxDecoration(color: Colors.teal),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.local_hospital, color: Colors.white, size: 48),
                  const SizedBox(height: 12),
                  const Text('New Light Medicine and Store', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            ListTile(
              leading: const Icon(Icons.inventory),
              title: const Text('Inventory'),
              onTap: () => Navigator.pop(context),
            ),
            ListTile(
              leading: const Icon(Icons.money_off),
              title: const Text('Expenses'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/expenses');
              },
            ),
            ListTile(
              leading: const Icon(Icons.bar_chart),
              title: const Text('Financials'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pushNamed(context, '/financials');
              },
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          _buildFilterChips(context),
          Expanded(
            child: Consumer<DrugProvider>(
              builder: (context, provider, child) {
                if (provider.isLoading) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (provider.error != null) {
                  return Center(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error_outline, color: Colors.red, size: 60),
                          const SizedBox(height: 16),
                          Text(
                            'Failed to load drugs: ${provider.error}',
                            textAlign: TextAlign.center,
                          ),
                          ElevatedButton(
                            onPressed: () => provider.fetchDrugs(),
                            child: const Text('Retry'),
                          ),
                        ],
                      ),
                    ),
                  );
                }

                if (provider.drugs.isEmpty) {
                  return const Center(child: Text('No drugs found.'));
                }

                return ListView.builder(
                  itemCount: provider.drugs.length,
                  itemBuilder: (context, index) {
                    final drug = provider.drugs[index];
                    final isExpiring = drug.expiryDate != null &&
                        drug.expiryDate!.difference(DateTime.now()).inDays < 60;
                    final isLow = drug.stock <= drug.reorderLevel;

                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                        side: BorderSide(color: Colors.grey.shade200),
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(12.0),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(drug.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                  if (drug.genericName != null)
                                    Text(drug.genericName!, style: TextStyle(color: Colors.grey.shade600, fontSize: 13, fontStyle: FontStyle.italic)),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(color: Colors.teal.shade50, borderRadius: BorderRadius.circular(4)),
                                        child: Text(drug.categoryName, style: TextStyle(color: Colors.teal.shade700, fontSize: 10, fontWeight: FontWeight.bold)),
                                      ),
                                      if (drug.dosage != null) ...[
                                        const SizedBox(width: 8),
                                        Text(drug.dosage!, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                                      ],
                                    ],
                                  ),
                                  if (drug.expiryDate != null) ...[
                                    const SizedBox(height: 8),
                                    Text(
                                      'Expires: ${drug.expiryDate!.toString().split(' ')[0]}',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: isExpiring ? Colors.red : Colors.grey.shade700,
                                        fontWeight: isExpiring ? FontWeight.bold : FontWeight.normal,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text('₦${drug.price.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                const SizedBox(height: 4),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: isLow ? Colors.red.shade50 : Colors.green.shade50,
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                  child: Text(
                                    'Stock: ${drug.stock}',
                                    style: TextStyle(
                                      color: isLow ? Colors.red : Colors.green,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChips(BuildContext context) {
    final provider = context.watch<DrugProvider>();
    final filters = ['All', 'Low Stock', '30 Days Expiry', '100 Days Expiry'];

    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        scrollDirection: Axis.horizontal,
        itemCount: filters.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final filter = filters[index];
          final isSelected = provider.currentFilter == filter;
          return ChoiceChip(
            label: Text(filter, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: isSelected ? Colors.white : Colors.black)),
            selected: isSelected,
            onSelected: (selected) {
              if (selected) provider.setFilter(filter);
            },
            selectedColor: Colors.teal,
            backgroundColor: Colors.grey.shade100,
            showCheckmark: false,
          );
        },
      ),
    );
  }
}
