/**
 * EpisodeLevelsScreen — Level select within an episode
 */
import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { EPISODES, loadStoryProgress } from '../game/episodeSystem';
import { getEpisodeLevels } from '../game/sceneLevels';
import { StoryProgress, DEFAULT_STORY_PROGRESS } from '../game/storyTypes';
import { Colors, Fonts } from '../theme';

export default function EpisodeLevelsScreen() {
  const { episodeId } = useLocalSearchParams<{ episodeId: string }>();
  const router = useRouter();
  const [progress, setProgress] = useState<StoryProgress>(DEFAULT_STORY_PROGRESS);

  const episode = EPISODES.find((e) => e.id === episodeId);
  const levels = getEpisodeLevels(episodeId ?? '');

  useFocusEffect(
    useCallback(() => {
      loadStoryProgress().then(setProgress);
    }, [])
  );

  if (!episode) {
    return (
      <View style={styles.root}>
        <Text style={styles.errorText}>Episode not found</Text>
      </View>
    );
  }

  const completedLevels = progress.episodeProgress[episode.id] ?? [];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerIcon}>{episode.icon}</Text>
          <View>
            <Text style={styles.headerTitle}>{episode.name}</Text>
            <Text style={styles.headerSubtitle}>{episode.subtitle}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.evidenceBtn}
          onPress={() => router.push(`/story/evidence/${episodeId}`)}
        >
          <Ionicons name="search" size={16} color={Colors.tertiary} />
          <Text style={styles.evidenceBtnText}>
            {progress.collectedClues.length > 0 ? `${progress.collectedClues.length}` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {levels.map((level, index) => {
          const isCompleted = completedLevels.includes(level.id);
          const isUnlocked = index === 0 || completedLevels.includes(levels[index - 1]?.id);
          const sceneResult = progress.sceneResults[level.id];
          const cluesCollected = sceneResult?.collectedClueIds?.length ?? 0;

          return (
            <Animated.View
              key={level.id}
              entering={FadeInDown.delay(index * 120).duration(350)}
            >
              <TouchableOpacity
                style={[
                  styles.levelCard,
                  isCompleted && styles.levelCompleted,
                  !isUnlocked && styles.levelLocked,
                ]}
                disabled={!isUnlocked}
                onPress={() => router.push(`/story/game/${level.id}`)}
                activeOpacity={0.7}
              >
                {/* Lock icon */}
                {!isUnlocked && (
                  <View style={styles.lockIcon}>
                    <Ionicons name="lock-closed" size={18} color={Colors.textLight} />
                  </View>
                )}

                {/* Level number */}
                <View style={[
                  styles.levelNum,
                  isCompleted && styles.levelNumComplete,
                ]}>
                  <Text style={[
                    styles.levelNumText,
                    isCompleted && styles.levelNumTextComplete,
                  ]}>
                    {index + 1}
                  </Text>
                </View>

                {/* Info */}
                <View style={styles.levelInfo}>
                  <Text style={styles.levelName}>{level.name}</Text>
                  <Text style={styles.levelBriefing} numberOfLines={1}>
                    {level.briefing}
                  </Text>
                  {isCompleted && sceneResult && (
                    <View style={styles.levelStats}>
                      <View style={styles.stars}>
                        {[1, 2, 3].map((s) => (
                          <Ionicons
                            key={s}
                            name={s <= (sceneResult.stars ?? 0) ? 'star' : 'star-outline'}
                            size={14}
                            color={s <= (sceneResult.stars ?? 0) ? Colors.starFilled : Colors.starEmpty}
                          />
                        ))}
                      </View>
                      <Text style={styles.cluesStat}>
                        🔍 {cluesCollected}/{level.clues.length}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Checkmark */}
                {isCompleted && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
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
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  headerIcon: { fontSize: 28 },
  headerTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  evidenceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 207, 72, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 207, 72, 0.3)',
  },
  evidenceBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.tertiary,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  levelCompleted: {
    borderColor: 'rgba(57, 255, 127, 0.15)',
  },
  levelLocked: { opacity: 0.4 },
  lockIcon: {
    position: 'absolute',
    right: 14,
    top: 14,
    zIndex: 5,
  },
  levelNum: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bgElevated,
    justifyContent: 'center', alignItems: 'center',
  },
  levelNumComplete: {
    backgroundColor: Colors.success,
  },
  levelNumText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.textSecondary,
  },
  levelNumTextComplete: {
    color: Colors.bgDark,
  },
  levelInfo: { flex: 1 },
  levelName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  levelBriefing: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textLight,
    marginTop: 2,
  },
  levelStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  stars: { flexDirection: 'row', gap: 2 },
  cluesStat: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.tertiary,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 100,
  },
});
