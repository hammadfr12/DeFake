import 'dart:io';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:file_picker/file_picker.dart';
import 'package:animate_do/animate_do.dart';
import '../providers/detection_notifier.dart';
import '../widgets/detection_widgets.dart';
import '../theme.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // Consumer listens to DetectionNotifier and rebuilds on notifyListeners()
    return Consumer<DetectionNotifier>(
      builder: (context, notifier, _) {
        return Scaffold(
          body: SafeArea(
            child: CustomScrollView(
              slivers: [
                // ── App Bar ────────────────────────────────────────────────
                SliverAppBar(
                  floating: true,
                  backgroundColor: AppTheme.surface,
                  elevation: 0,
                  title: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppTheme.primary.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(Icons.security_rounded,
                            color: AppTheme.primary, size: 22),
                      ),
                      const SizedBox(width: 12),
                      const Text(
                        'DeFake',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  actions: [
                    if (notifier.hasResult)
                      IconButton(
                        onPressed: notifier.reset,
                        icon: const Icon(Icons.refresh_rounded),
                        tooltip: 'Analyze another',
                      ),
                  ],
                ),

                SliverPadding(
                  padding: const EdgeInsets.all(20),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      // ── Hero text ──────────────────────────────────────
                      FadeInDown(
                        delay: const Duration(milliseconds: 100),
                        child: const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Detect DeepFakes',
                              style: TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w800,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                            SizedBox(height: 6),
                            Text(
                              'Upload an image or video to check\nif it\'s AI-generated or real.',
                              style: TextStyle(
                                fontSize: 15,
                                color: AppTheme.textSecondary,
                                height: 1.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 28),

                      // ── Upload card ────────────────────────────────────
                      FadeInUp(
                        delay: const Duration(milliseconds: 200),
                        child: UploadCard(
                          hasFile: notifier.hasFileSelected,
                          fileName: notifier.displayFileName,
                          onTap: notifier.isLoading
                              ? () {}
                              : () => _pick(context, notifier),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // ── Gallery / Camera buttons (mobile only) ─────────
                      if (!kIsWeb &&
                          !notifier.isLoading &&
                          !notifier.hasResult)
                        FadeInUp(
                          delay: const Duration(milliseconds: 300),
                          child: Row(
                            children: [
                              Expanded(
                                child: _SourceButton(
                                  icon: Icons.photo_library_outlined,
                                  label: 'Gallery',
                                  onTap: () =>
                                      _pickFromGallery(context, notifier),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: _SourceButton(
                                  icon: Icons.camera_alt_outlined,
                                  label: 'Camera',
                                  onTap: () =>
                                      _pickFromCamera(context, notifier),
                                ),
                              ),
                            ],
                          ),
                        ),

                      const SizedBox(height: 24),

                      // ── Analyze button ─────────────────────────────────
                      if (notifier.hasFileSelected &&
                          !notifier.isLoading &&
                          !notifier.hasResult)
                        FadeInUp(
                          delay: const Duration(milliseconds: 350),
                          child: SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: notifier.analyze,
                              icon: const Icon(Icons.analytics_outlined),
                              label: const Text('Analyze Now'),
                            ),
                          ),
                        ),

                      // ── Loading ────────────────────────────────────────
                      if (notifier.isLoading) const AnalyzingIndicator(),

                      // ── Result ─────────────────────────────────────────
                      if (notifier.hasResult)
                        ResultCard(result: notifier.result!),

                      // ── Error ──────────────────────────────────────────
                      if (notifier.hasError)
                        FadeIn(
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppTheme.fakeRed.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                  color: AppTheme.fakeRed.withOpacity(0.3)),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(Icons.error_outline,
                                    color: AppTheme.fakeRed),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    notifier.errorMessage ??
                                        'Something went wrong.',
                                    style: const TextStyle(
                                        color: AppTheme.fakeRed, fontSize: 14),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),

                      // ── Analyze another / retry ────────────────────────
                      if (notifier.hasResult || notifier.hasError) ...[
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            onPressed: notifier.reset,
                            icon: const Icon(Icons.add_photo_alternate_outlined),
                            label: Text(
                              notifier.hasResult
                                  ? 'Analyze Another'
                                  : 'Try Again',
                            ),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppTheme.primary,
                              side: const BorderSide(color: AppTheme.primary),
                              padding:
                                  const EdgeInsets.symmetric(vertical: 16),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          ),
                        ),
                      ],

                      const SizedBox(height: 40),

                      // ── How it works ───────────────────────────────────
                      if (!notifier.isLoading && !notifier.hasResult)
                        FadeInUp(
                          delay: const Duration(milliseconds: 400),
                          child: const _InfoSection(),
                        ),
                    ]),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  // ── File picking ────────────────────────────────────────────────────────────

  Future<void> _pick(BuildContext context, DetectionNotifier notifier) async {
    if (kIsWeb) {
      await _pickWeb(notifier);
    } else {
      await _pickFromGallery(context, notifier);
    }
  }

  Future<void> _pickWeb(DetectionNotifier notifier) async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mov'],
      withData: true,
    );
    if (result != null && result.files.single.bytes != null) {
      notifier.selectBytes(
        bytes: result.files.single.bytes!,
        fileName: result.files.single.name,
      );
    }
  }

  Future<void> _pickFromGallery(
      BuildContext context, DetectionNotifier notifier) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery);
    if (picked != null) notifier.selectFile(File(picked.path));
  }

  Future<void> _pickFromCamera(
      BuildContext context, DetectionNotifier notifier) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.camera);
    if (picked != null) notifier.selectFile(File(picked.path));
  }
}

// ── Source Button ─────────────────────────────────────────────────────────────
class _SourceButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _SourceButton(
      {required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: AppTheme.surfaceCard,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withOpacity(0.08)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 18, color: AppTheme.textSecondary),
            const SizedBox(width: 8),
            Text(label,
                style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: AppTheme.textSecondary)),
          ],
        ),
      ),
    );
  }
}

// ── Info Section ──────────────────────────────────────────────────────────────
class _InfoSection extends StatelessWidget {
  const _InfoSection();

  @override
  Widget build(BuildContext context) {
    const steps = [
      (Icons.upload_file_outlined, 'Upload',
          'Select any image or video from your device'),
      (Icons.psychology_outlined, 'Analyze',
          'MobileNetV2 model runs inference on your file'),
      (Icons.verified_outlined, 'Result',
          'Get real/fake verdict with confidence score'),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('How it works',
            style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary)),
        const SizedBox(height: 16),
        ...steps.map((e) => Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(e.$1, size: 20, color: AppTheme.primary),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(e.$2,
                            style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.textPrimary)),
                        const SizedBox(height: 2),
                        Text(e.$3,
                            style: const TextStyle(
                                fontSize: 13, color: AppTheme.textSecondary)),
                      ],
                    ),
                  ),
                ],
              ),
            )),
      ],
    );
  }
}
