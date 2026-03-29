# DeFake – DeepFake Detection App

A cross-platform Flutter app (Android + Web) that detects AI-generated deepfake media by sending files to a MobileNetV2 Python backend.

## Features

- 📸 Pick images/videos from gallery or camera (mobile) or file browser (web)
- 🧠 Sends file to Python Flask + MobileNetV2 backend via multipart POST
- 📊 Real/Fake verdict with confidence %, real score, and fake score breakdown
- 🎨 Dark UI with smooth animations
- 🌐 Runs on Android and Flutter Web

## Tech Stack

| Layer | Tech |
|---|---|
| Framework | Flutter 3.x |
| State Management | Provider + ChangeNotifier |
| File Picking | `image_picker` (mobile), `file_picker` (web) |
| HTTP | `http` + `http_parser` |
| Animations | `animate_do` |
| Progress | `percent_indicator` |
| Backend | Python Flask + MobileNetV2 |

## Project Structure

```
lib/
├── main.dart                          # ChangeNotifierProvider setup
├── theme.dart                         # Colors, ThemeData
├── models/
│   └── detection_result.dart          # DetectionResult data class
├── services/
│   └── detection_service.dart         # API calls (mobile + web)
├── providers/
│   └── detection_notifier.dart        # ChangeNotifier state management
├── screens/
│   └── home_screen.dart               # Consumer<DetectionNotifier>
└── widgets/
    └── detection_widgets.dart         # UploadCard, ResultCard, AnalyzingIndicator
```

## Run

```bash
git clone https://github.com/hammadfr12/defake-flutter
cd defake-flutter
flutter create . --project-name defake   # generates platform folders
flutter pub get

# Android
flutter run

# Web
flutter run -d chrome
```

## Backend

```bash
pip install flask tensorflow pillow numpy
python app.py   # runs at http://localhost:5000
```

Expected response from `POST /predict`:
```json
{
  "is_fake": true,
  "confidence": 0.94,
  "fake_score": 0.94,
  "real_score": 0.06,
  "file_name": "sample.jpg",
  "file_type": "image",
  "analyzed_at": "2026-03-29T12:00:00"
}
```

## URL config

Edit `lib/services/detection_service.dart`:
```dart
static String get _baseUrl {
  if (kIsWeb) return 'http://localhost:5000';
  return 'http://10.0.2.2:5000';        // Android emulator
  // return 'http://192.168.x.x:5000';  // physical device (your LAN IP)
}
```
