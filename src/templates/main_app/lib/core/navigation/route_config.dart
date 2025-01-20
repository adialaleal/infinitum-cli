import 'package:flutter/material.dart';

class RouteConfig {
  final Widget Function(dynamic arguments) builder;

  const RouteConfig({
    required this.builder,
  });

  static final Map<String, RouteConfig> routes = {
    // Register your routes here
    // Example:
    // '/': RouteConfig(builder: (_) => const HomePage()),
    // '/details': RouteConfig(builder: (args) => DetailsPage(data: args)),
  };
}
