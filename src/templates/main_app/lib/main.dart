import 'package:flutter/material.dart';
import 'core/app_widget.dart';
import 'core/di/service_locator.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize service locator
  await ServiceLocator.init();
  
  runApp(const AppWidget());
}
