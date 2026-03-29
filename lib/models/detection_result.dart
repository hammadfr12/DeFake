class DetectionResult {
  final bool isFake;
  final double confidence;
  final double fakeScore;
  final double realScore;
  final String fileName;
  final String fileType;
  final DateTime analyzedAt;

  const DetectionResult({
    required this.isFake,
    required this.confidence,
    required this.fakeScore,
    required this.realScore,
    required this.fileName,
    required this.fileType,
    required this.analyzedAt,
  });

  factory DetectionResult.fromJson(Map<String, dynamic> json) {
    return DetectionResult(
      isFake: json['is_fake'] as bool,
      confidence: (json['confidence'] as num).toDouble(),
      fakeScore: (json['fake_score'] as num).toDouble(),
      realScore: (json['real_score'] as num).toDouble(),
      fileName: json['file_name'] as String,
      fileType: json['file_type'] as String,
      analyzedAt: DateTime.parse(json['analyzed_at'] as String),
    );
  }

  String get verdict => isFake ? 'FAKE' : 'REAL';
  String get confidencePercent => '${(confidence * 100).toStringAsFixed(1)}%';
}
