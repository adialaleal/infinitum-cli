import 'package:flutter_modular/flutter_modular.dart';
import '../router/app_routes.dart';

class AppModule extends Module {
  @override
  void binds(i) {
    // Register your global dependencies here
  }

  @override
  void routes(r) {
    for (final route in AppRoutes.routes) {
      r.module(route.path, module: route.module);
    }
  }
}
