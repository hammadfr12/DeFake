import 'dart:io';
import 'package:flutter/foundation.dart';
import '../models/detection_result.dart';
import '../services/detection_service.dart';

enum DetectionStatus { idle, loading, success, error }

class DetectionNotifier extends ChangeNotifier {
  final DetectionService _service = DetectionService();

  DetectionStatus _status = DetectionStatus.idle;
  File? _selectedFile;           // mobile
  List<int>? _selectedBytes;    // web
  String? _selectedFileName;    // web
  DetectionResult? _result;
  String? _errorMessage;

  // ── Getters ─────────────────────────────────────────────────────────────────
  DetectionStatus get status => _status;
  DetectionResult? get result => _result;
  String? get errorMessage => _errorMessage;

  bool get isLoading => _status == DetectionStatus.loading;
  bool get hasResult => _status == DetectionStatus.success && _result != null;
  bool get hasError => _status == DetectionStatus.error;

  bool get hasFileSelected =>
      _selectedFile != null ||
      (_selectedBytes != null && _selectedFileName != null);

  String? get displayFileName =>
      _selectedFileName ?? _selectedFile?.path.split('/').last;

  // ── Actions ──────────────────────────────────────────────────────────────────

  /// Called on mobile after image_picker
  void selectFile(File file) {
    _selectedFile = file;
    _selectedBytes = null;
    _selectedFileName = null;
    _result = null;
    _errorMessage = null;
    _status = DetectionStatus.idle;
    notifyListeners();
  }

  /// Called on web after file_picker returns bytes
  void selectBytes({required List<int> bytes, required String fileName}) {
    _selectedBytes = bytes;
    _selectedFileName = fileName;
    _selectedFile = null;
    _result = null;
    _errorMessage = null;
    _status = DetectionStatus.idle;
    notifyListeners();
  }

  /// Send file to backend and update state
  Future<void> analyze() async {
    if (!hasFileSelected) return;

    _status = DetectionStatus.loading;
    notifyListeners();

    try {
      if (kIsWeb && _selectedBytes != null) {
        _result = await _service.analyzeBytes(
          bytes: _selectedBytes!,
          fileName: _selectedFileName!,
        );
      } else if (_selectedFile != null) {
        _result = await _service.analyzeFile(_selectedFile!);
      }
      _status = DetectionStatus.success;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _status = DetectionStatus.error;
    }

    notifyListeners();
  }

  /// Reset everything back to idle
  void reset() {
    _status = DetectionStatus.idle;
    _selectedFile = null;
    _selectedBytes = null;
    _selectedFileName = null;
    _result = null;
    _errorMessage = null;
    notifyListeners();
  }
}
