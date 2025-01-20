import 'package:get_it/get_it.dart';

final getIt = GetIt.instance;

class ServiceLocator {
  static Future<void> init() async {
    // Register your dependencies here
    // Example:
    // getIt.registerSingleton<AuthService>(AuthService());
    // getIt.registerLazySingleton<UserRepository>(() => UserRepository());
  }
  
  static T get<T extends Object>() => getIt<T>();
  
  static void registerSingleton<T extends Object>(T instance) {
    getIt.registerSingleton<T>(instance);
  }
  
  static void registerFactory<T extends Object>(T Function() factory) {
    getIt.registerFactory<T>(factory);
  }
  
  static void registerLazySingleton<T extends Object>(T Function() factory) {
    getIt.registerLazySingleton<T>(factory);
  }
}
