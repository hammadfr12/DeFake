import 'dart:io';
import 'dart:convert';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:mime/mime.dart';
import '../models/detection_result.dart';

class DetectionService {
  /// Android emulator → 10.0.2.2 maps to host machine localhost
  /// Physical device → replace with your LAN IP e.g. 192.168.1.5
  /// Flutter Web → localhost (same origin)
  static String get _baseUrl {
    if (kIsWeb) return 'http://localhost:5000';
    return 'http://10.0.2.2:5000';
  }

  static const Duration _timeout = Duration(seconds: 30);

  /// Mobile: analyze a File
  Future<DetectionResult> analyzeFile(File file) async {
    final fileName = file.path.split('/').last;
    final mimeType = lookupMimeType(file.path) ?? 'application/octet-stream';

    final uri = Uri.parse('$_baseUrl/predict');
    final request = http.MultipartRequest('POST', uri);
    request.files.add(
      await http.MultipartFile.fromPath(
        'file',
        file.path,
        contentType: MediaType.parse(mimeType),
      ),
    );

    final streamed = await request.send().timeout(_timeout);
    final response = await http.Response.fromStream(streamed);

    if (response.statusCode == 200) {
      return DetectionResult.fromJson(
        jsonDecode(response.body) as Map<String, dynamic>,
      );
    }
    throw Exception('Server error ${response.statusCode}: ${response.body}');
  }

  /// Web: analyze raw bytes from file_picker
  Future<DetectionResult> analyzeBytes({
    required List<int> bytes,
    required String fileName,
  }) async {
    final mimeType = lookupMimeType(fileName) ?? 'application/octet-stream';

    final uri = Uri.parse('$_baseUrl/predict');
    final request = http.MultipartRequest('POST', uri);
    request.files.add(
      http.MultipartFile.fromBytes(
        'file',
        bytes,
        filename: fileName,
        contentType: MediaType.parse(mimeType),
      ),
    );

    final streamed = await request.send().timeout(_timeout);
    final response = await http.Response.fromStream(streamed);

    if (response.statusCode == 200) {
      return DetectionResult.fromJson(
        jsonDecode(response.body) as Map<String, dynamic>,
      );
    }
    throw Exception('Server error ${response.statusCode}: ${response.body}');
  }
}
