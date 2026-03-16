/**
 * IncidentReport — Episode completion screen showing the investigation results
 */
import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EpisodeData } from '../game/storyTypes';
import { BuiltReport } from '../game/episodeSystem';
import { Colors, Fonts } from '../theme';

interface IncidentReportProps {
  episode: EpisodeData;
  report: BuiltReport;
  onClose: () => void;
}

export default function IncidentReport({ episode, report, onClose }: IncidentReportProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Ionicons name="document-text" size={20} color={Colors.tertiary} />
          </View>
          <Text style={styles.title}>INCIDENT REPORT</Text>
          <Text style={styles.subtitle}>{episode.name}</Text>
        </View>

        {/* Completion bar */}
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${report.completionPercent}%` }]}
            />
          </View>
          <Text style={styles.progressText}>{report.completionPercent}%</Text>
        </View>

        {/* Report fragments */}
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {report.fragments.map((frag, i) => (
            <View
              key={i}
              style={[
                styles.fragment,
                frag.isRevealed ? styles.fragmentRevealed : styles.fragmentHidden,
              ]}
            >
              <View style={styles.fragHeader}>
                <Ionicons
                  name={frag.isRevealed ? 'checkmark-circle' : 'help-circle'}
                  size={16}
                  color={frag.isRevealed ? Colors.success : Colors.textLight}
                />
                <Text style={styles.fragIndex}>Fragment {i + 1}</Text>
              </View>
              <Text
                style={[
                  styles.fragText,
                  !frag.isRevealed && styles.fragTextHidden,
                ]}
              >
                {frag.text}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Detective badge */}
        {report.isComplete && (
          <View style={styles.detectiveBadge}>
            <Text style={styles.detectiveIcon}>🕵️</Text>
            <Text style={styles.detectiveText}>DETECTIVE BADGE EARNED!</Text>
          </View>
        )}

        {/* Close button */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeBtnText}>CLOSE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  card: {
    width: '88%',
    maxHeight: '80%',
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 207, 72, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    color: Colors.tertiary,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.bgElevated,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.tertiary,
  },
  progressText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.tertiary,
    fontVariant: ['tabular-nums'],
  },
  scroll: {
    maxHeight: 300,
    marginBottom: 16,
  },
  fragment: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  fragmentRevealed: {
    backgroundColor: 'rgba(57, 255, 127, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(57, 255, 127, 0.2)',
  },
  fragmentHidden: {
    backgroundColor: Colors.bgElevated,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  fragHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  fragIndex: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.textLight,
    letterSpacing: 1,
  },
  fragText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 19,
  },
  fragTextHidden: {
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  detectiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: 'rgba(255, 207, 72, 0.12)',
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.tertiary,
  },
  detectiveIcon: {
    fontSize: 24,
  },
  detectiveText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.tertiary,
    letterSpacing: 1,
  },
  closeBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.bgDark,
    letterSpacing: 1,
  },
});
