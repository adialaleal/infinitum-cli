import 'package:flutter/material.dart';
import 'route_config.dart';

class AppRouter {
  static const String initial = '/';

  static Route<dynamic>? onGenerateRoute(RouteSettings settings) {
    // Get route configuration
    final route = RouteConfig.routes[settings.name];
    
    if (route == null) {
      return MaterialPageRoute(
        builder: (_) => const Scaffold(
          body: Center(child: Text('Route not found')),
        ),
      );
    }

    return MaterialPageRoute(
      builder: (_) => route.builder(settings.arguments),
      settings: settings,
    );
  }
}
