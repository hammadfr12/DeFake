import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'providers/detection_notifier.dart';
import 'screens/home_screen.dart';
import 'theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ),
  );
  runApp(
    // Wrap app with ChangeNotifierProvider so any widget can access DetectionNotifier
    ChangeNotifierProvider(
      create: (_) => DetectionNotifier(),
      child: const DeFakeApp(),
    ),
  );
}

class DeFakeApp extends StatelessWidget {
  const DeFakeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'DeFake',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      home: const HomeScreen(),
    );
  }
}
