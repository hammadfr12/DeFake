import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:percent_indicator/percent_indicator.dart';
import '../theme.dart';
import '../models/detection_result.dart';

// ─── Upload Card ──────────────────────────────────────────────────────────────
class UploadCard extends StatelessWidget {
  final bool hasFile;
  final String? fileName;
  final VoidCallback onTap;

  const UploadCard({
    super.key,
    required this.hasFile,
    this.fileName,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        width: double.infinity,
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: AppTheme.surfaceCard,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: hasFile
                ? AppTheme.primary.withOpacity(0.6)
                : Colors.white.withOpacity(0.1),
            width: hasFile ? 2 : 1,
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 300),
              child: hasFile
                  ? const Icon(Icons.check_circle_rounded,
                      size: 56, color: AppTheme.primary, key: ValueKey('check'))
                  : const Icon(Icons.cloud_upload_outlined,
                      size: 56,
                      color: AppTheme.textSecondary,
                      key: ValueKey('upload')),
            ),
            const SizedBox(height: 16),
            Text(
              hasFile ? (fileName ?? 'File selected') : 'Tap to select file',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: hasFile ? AppTheme.textPrimary : AppTheme.textSecondary,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 8),
            Text(
              hasFile ? 'Tap to change file' : 'Supports images and videos',
              style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Result Card ──────────────────────────────────────────────────────────────
class ResultCard extends StatelessWidget {
  final DetectionResult result;

  const ResultCard({super.key, required this.result});

  @override
  Widget build(BuildContext context) {
    final color = result.isFake ? AppTheme.fakeRed : AppTheme.realGreen;
    final icon = result.isFake ? Icons.warning_rounded : Icons.verified_rounded;

    return FadeInUp(
      duration: const Duration(milliseconds: 500),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withOpacity(0.4), width: 1.5),
        ),
        child: Column(
          children: [
            // Verdict badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.15),
                borderRadius: BorderRadius.circular(50),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(icon, color: color, size: 22),
                  const SizedBox(width: 8),
                  Text(
                    result.verdict,
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: color,
                      letterSpacing: 2,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // Confidence circle
            CircularPercentIndicator(
              radius: 70,
              lineWidth: 10,
              percent: result.confidence,
              center: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    result.confidencePercent,
                    style: TextStyle(
                        fontSize: 22, fontWeight: FontWeight.w800, color: color),
                  ),
                  const Text(
                    'confidence',
                    style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                  ),
                ],
              ),
              progressColor: color,
              backgroundColor: color.withOpacity(0.15),
              circularStrokeCap: CircularStrokeCap.round,
              animation: true,
              animationDuration: 1200,
            ),
            const SizedBox(height: 28),

            // Score bars
            _ScoreRow(label: 'Real Score', value: result.realScore, color: AppTheme.realGreen),
            const SizedBox(height: 12),
            _ScoreRow(label: 'Fake Score', value: result.fakeScore, color: AppTheme.fakeRed),
            const SizedBox(height: 20),

            Divider(color: Colors.white.withOpacity(0.08)),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _InfoChip(icon: Icons.insert_drive_file_outlined, label: result.fileName),
                _InfoChip(
                  icon: Icons.access_time_rounded,
                  label:
                      '${result.analyzedAt.hour.toString().padLeft(2, '0')}:${result.analyzedAt.minute.toString().padLeft(2, '0')}',
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ScoreRow extends StatelessWidget {
  final String label;
  final double value;
  final Color color;

  const _ScoreRow({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        SizedBox(
          width: 90,
          child: Text(label,
              style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
        ),
        Expanded(
          child: LinearPercentIndicator(
            percent: value,
            lineHeight: 8,
            progressColor: color,
            backgroundColor: color.withOpacity(0.15),
            barRadius: const Radius.circular(4),
            animation: true,
            animationDuration: 1000,
            padding: EdgeInsets.zero,
          ),
        ),
        const SizedBox(width: 12),
        Text(
          '${(value * 100).toStringAsFixed(1)}%',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: color),
        ),
      ],
    );
  }
}

class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;

  const _InfoChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: AppTheme.textSecondary),
        const SizedBox(width: 4),
        ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 130),
          child: Text(
            label,
            style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

// ─── Analyzing Indicator ──────────────────────────────────────────────────────
class AnalyzingIndicator extends StatelessWidget {
  const AnalyzingIndicator({super.key});

  @override
  Widget build(BuildContext context) {
    return FadeIn(
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: AppTheme.surfaceCard,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white.withOpacity(0.08)),
        ),
        child: Column(
          children: [
            Pulse(
              infinite: true,
              child: const Icon(Icons.psychology_outlined,
                  size: 56, color: AppTheme.primary),
            ),
            const SizedBox(height: 20),
            const Text(
              'Analyzing media...',
              style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary),
            ),
            const SizedBox(height: 8),
            const Text(
              'Running MobileNetV2 inference',
              style: TextStyle(fontSize: 13, color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 24),
            LinearProgressIndicator(
              backgroundColor: Colors.white.withOpacity(0.08),
              color: AppTheme.primary,
              borderRadius: BorderRadius.circular(4),
            ),
          ],
        ),
      ),
    );
  }
}
