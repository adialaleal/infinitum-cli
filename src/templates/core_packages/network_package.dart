import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';

enum NetworkStatus {
  connected,
  disconnected
}

class NetworkService {
  final _controller = StreamController<NetworkStatus>();
  final Connectivity _connectivity = Connectivity();

  Stream<NetworkStatus> get status => _controller.stream;

  NetworkService() {
    _connectivity.onConnectivityChanged.listen((result) {
      _checkStatus(result);
    });
  }

  void _checkStatus(ConnectivityResult result) {
    if (result == ConnectivityResult.none) {
      _controller.add(NetworkStatus.disconnected);
    } else {
      _controller.add(NetworkStatus.connected);
    }
  }

  Future<bool> isConnected() async {
    final result = await _connectivity.checkConnectivity();
    return result != ConnectivityResult.none;
  }

  Future<bool> isWifi() async {
    final result = await _connectivity.checkConnectivity();
    return result == ConnectivityResult.wifi;
  }

  Future<bool> isMobile() async {
    final result = await _connectivity.checkConnectivity();
    return result == ConnectivityResult.mobile;
  }

  void dispose() {
    _controller.close();
  }
}
