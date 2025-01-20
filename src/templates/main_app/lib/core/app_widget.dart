import 'package:flutter/material.dart';
import 'package:design_package/design_package.dart';
import 'navigation/app_router.dart';

class AppWidget extends StatelessWidget {
  const AppWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Your App',
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      onGenerateRoute: AppRouter.onGenerateRoute,
      initialRoute: AppRouter.initial,
    );
  }
}
