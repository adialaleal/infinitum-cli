import 'package:flutter_modular/flutter_modular.dart';

class AppRoute {
  final String path;
  final Module module;

  const AppRoute(this.path, this.module);
}

class AppRoutes {
  static final List<AppRoute> routes = [
    // Register your micro frontends routes here
    // Example:
    // AppRoute('/auth', AuthModule()),
    // AppRoute('/home', HomeModule()),
  ];
}
