/**
 * StoryModeScreen — Episode select screen for Story Mode
 */
import React, { useCallback, useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInDown,
} from 'react-native-reanimated';
import { EPISODES, isEpisodeUnlocked, loadStoryProgress, buildIncidentReport } from '../game/episodeSystem';
import { getEpisodeLevels } from '../game/sceneLevels';
import { StoryProgress, DEFAULT_STORY_PROGRESS } from '../game/storyTypes';
import { SoundManager } from '../audio/SoundManager';
import { Colors, Fonts } from '../theme';
import IncidentReport from '../components/IncidentReport';

const { width: W } = Dimensions.get('window');

export default function StoryModeScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<StoryProgress>(DEFAULT_STORY_PROGRESS);
  const [showReport, setShowReport] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      SoundManager.playAdaptiveMusic('menu');
      loadStoryProgress().then(setProgress);
      return () => { SoundManager.stopAdaptiveMusic(); };
    }, [])
  );

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>STORY MODE</Text>
          <Text style={styles.subtitle}>Uncover the truth behind each scene</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {EPISODES.map((episode, index) => {
          const unlocked = isEpisodeUnlocked(index, progress);
          const levels = getEpisodeLevels(episode.id);
          const completedLevels = progress.episodeProgress[episode.id] ?? [];
          const totalClues = levels.reduce((sum, l) => sum + l.clues.length, 0);
          const collectedClues = progress.collectedClues.filter((c) =>
            c.startsWith(episode.id)
          ).length;
          const hasBadge = progress.detectiveBadges.includes(episode.id);
          const allLevelsDone = completedLevels.length >= episode.levelIds.length;

          return (
            <Animated.View
              key={episode.id}
              entering={FadeInDown.delay(index * 150).duration(400)}
            >
              <TouchableOpacity
                style={[
                  styles.episodeCard,
                  !unlocked && styles.episodeLocked,
                ]}
                disabled={!unlocked}
                onPress={() => router.push(`/story/${episode.id}`)}
                activeOpacity={0.7}
              >
                {/* Lock overlay */}
                {!unlocked && (
                  <View style={styles.lockOverlay}>
                    <Ionicons name="lock-closed" size={28} color={Colors.textLight} />
                  </View>
                )}

                {/* Episode info */}
                <View style={styles.episodeHeader}>
                  <Text style={styles.episodeIcon}>{episode.icon}</Text>
                  <View style={styles.episodeInfo}>
                    <Text style={styles.episodeName}>{episode.name}</Text>
                    <Text style={styles.episodeSubtitle}>{episode.subtitle}</Text>
                  </View>
                  {hasBadge && <Text style={styles.badge}>🕵️</Text>}
                </View>

                {/* Progress */}
                {unlocked && (
                  <View style={styles.progressSection}>
                    {/* Level dots */}
                    <View style={styles.levelDots}>
                      {episode.levelIds.map((lid) => {
                        const completed = completedLevels.includes(lid);
                        return (
                          <View
                            key={lid}
                            style={[
                              styles.levelDot,
                              completed ? styles.dotComplete : styles.dotIncomplete,
                            ]}
                          />
                        );
                      })}
                    </View>

                    {/* Clue progress */}
                    <View style={styles.clueProgress}>
                      <Text style={styles.clueProgressIcon}>🔍</Text>
                      <Text style={styles.clueProgressText}>
                        {collectedClues}/{totalClues} clues
                      </Text>
                    </View>
                  </View>
                )}

                {/* View Report button */}
                {allLevelsDone && (
                  <TouchableOpacity
                    style={styles.reportBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      setShowReport(episode.id);
                    }}
                  >
                    <Ionicons name="document-text" size={14} color={Colors.tertiary} />
                    <Text style={styles.reportBtnText}>VIEW REPORT</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}

        {/* Coming soon placeholder */}
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonIcon}>🚧</Text>
          <Text style={styles.comingSoonText}>More episodes coming soon...</Text>
        </View>
      </ScrollView>

      {/* Incident Report modal */}
      {showReport && (() => {
        const ep = EPISODES.find((e) => e.id === showReport);
        if (!ep) return null;
        const report = buildIncidentReport(ep, progress.collectedClues);
        return (
          <IncidentReport
            episode={ep}
            report={report}
            onClose={() => setShowReport(null)}
          />
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgDark },
  header: {
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.bgElevated,
    justifyContent: 'center', alignItems: 'center',
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    color: Colors.primary,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  episodeCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  episodeLocked: { opacity: 0.5 },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  episodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  episodeIcon: { fontSize: 32 },
  episodeInfo: { flex: 1 },
  episodeName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 17,
    color: Colors.textPrimary,
  },
  episodeSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  badge: { fontSize: 24 },
  progressSection: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelDots: { flexDirection: 'row', gap: 6 },
  levelDot: { width: 10, height: 10, borderRadius: 5 },
  dotComplete: { backgroundColor: Colors.success },
  dotIncomplete: { backgroundColor: Colors.bgElevated, borderWidth: 1, borderColor: Colors.textLight },
  clueProgress: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  clueProgressIcon: { fontSize: 12 },
  clueProgressText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.tertiary,
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 207, 72, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 207, 72, 0.25)',
  },
  reportBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.tertiary,
    letterSpacing: 1,
  },
  comingSoon: {
    alignItems: 'center',
    paddingVertical: 30,
    opacity: 0.5,
  },
  comingSoonIcon: { fontSize: 28, marginBottom: 8 },
  comingSoonText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.textLight,
  },
});
