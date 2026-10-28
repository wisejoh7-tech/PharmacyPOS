import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/drug_provider.dart';
import 'providers/expense_provider.dart';
import 'providers/auth_provider.dart';
import 'screens/drug_list_screen.dart';
import 'screens/expense_screen.dart';
import 'screens/financials_screen.dart';
import 'screens/login_screen.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => DrugProvider()),
        ChangeNotifierProvider(create: (_) => ExpenseProvider()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'New Light Medicine and Store',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.teal),
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          backgroundColor: Colors.teal,
          foregroundColor: Colors.white,
          centerTitle: true,
        ),
      ),
      // Use AuthProvider to decide the initial screen
      home: Consumer<AuthProvider>(
        builder: (context, auth, _) {
          return auth.isAuthenticated ? const DrugListScreen() : const LoginScreen();
        },
      ),
      routes: {
        '/login': (context) => const LoginScreen(),
        '/expenses': (context) => const ExpenseScreen(),
        '/financials': (context) => const FinancialsScreen(),
      },
    );
  }
}
