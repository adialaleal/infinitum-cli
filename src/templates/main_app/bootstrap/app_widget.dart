import 'package:flutter/material.dart';
import 'package:flutter_modular/flutter_modular.dart';
import 'package:design_package/design_package.dart';

class AppWidget extends StatelessWidget {
  const AppWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Your App Name',
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      routerDelegate: Modular.routerDelegate,
      routeInformationParser: Modular.routeInformationParser,
    );
  }
}
