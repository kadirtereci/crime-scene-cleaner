import React, { useCallback, useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ALL_LEVELS } from '../game/levels';
import { PlayerProgress, EnvironmentType, TOOLS, ToolType } from '../game/types';
import { loadProgress } from '../game/progressStorage';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts } from '../theme';
import { SoundManager } from '../audio/SoundManager';

const POLICE_RED = '#FF1744';
const POLICE_BLUE = '#2979FF';

function PoliceLights() {
  const insets = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();

  const phase = useSharedValue(0);

  useEffect(() => {
    phase.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 150 }),
        withTiming(0, { duration: 100 }),
        withTiming(1, { duration: 120 }),
        withTiming(0, { duration: 130 }),
        withTiming(-1, { duration: 150 }),
        withTiming(0, { duration: 100 }),
        withTiming(-1, { duration: 120 }),
        withTiming(0, { duration: 130 }),
      ),
      -1,
    );
  }, []);

  // phase > 0 = red on, phase < 0 = blue on
  const redStyle = useAnimatedStyle(() => ({
    opacity: phase.value > 0 ? phase.value : 0,
  }));
  const blueStyle = useAnimatedStyle(() => ({
    opacity: phase.value < 0 ? -phase.value : 0,
  }));

  // Position the bar just below the safe area (right under Dynamic Island)
  const barTop = insets.top > 50 ? insets.top - 6 : insets.top;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: barTop + 30,
        zIndex: 100,
      }}
    >
      {/* ── Red side (left half) ── */}
      {/* Solid bright bar */}
      <Animated.View style={[{
        position: 'absolute',
        top: barTop,
        left: 16,
        right: screenW / 2 + 10,
        height: 3,
        borderRadius: 2,
        backgroundColor: POLICE_RED,
      }, redStyle]} />
      {/* Glow behind bar */}
      <Animated.View style={[{
        position: 'absolute',
        top: barTop - 12,
        left: 0,
        width: screenW / 2 - 20,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'transparent',
        shadowColor: POLICE_RED,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 20,
        // Elevation for Android shadow
        elevation: 20,
      }, redStyle]} />
      {/* Top edge ambient */}
      <Animated.View style={[{
        position: 'absolute',
        top: 0,
        left: 0,
        right: screenW / 2,
        height: barTop,
        backgroundColor: POLICE_RED,
        opacity: 0.08,
      }, redStyle]} />

      {/* ── Blue side (right half) ── */}
      {/* Solid bright bar */}
      <Animated.View style={[{
        position: 'absolute',
        top: barTop,
        left: screenW / 2 + 10,
        right: 16,
        height: 3,
        borderRadius: 2,
        backgroundColor: POLICE_BLUE,
      }, blueStyle]} />
      {/* Glow behind bar */}
      <Animated.View style={[{
        position: 'absolute',
        top: barTop - 12,
        right: 0,
        width: screenW / 2 - 20,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'transparent',
        shadowColor: POLICE_BLUE,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 20,
        elevation: 20,
      }, blueStyle]} />
      {/* Top edge ambient */}
      <Animated.View style={[{
        position: 'absolute',
        top: 0,
        right: 0,
        left: screenW / 2,
        height: barTop,
        backgroundColor: POLICE_BLUE,
        opacity: 0.08,
      }, blueStyle]} />
    </View>
  );
}

const ENV_META: Record<EnvironmentType, {
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tagline: string;
}> = {
  apartment: {
    color: '#FF6B6B',
    icon: 'home',
    label: 'APARTMENT',
    tagline: 'The Rookie Jobs',
  },
  warehouse: {
    color: '#636E72',
    icon: 'cube',
    label: 'WAREHOUSE',
    tagline: 'Moving Up',
  },
  office: {
    color: '#6C5CE7',
    icon: 'briefcase',
    label: 'OFFICE',
    tagline: 'The Big Leagues',
  },
};

function StarDisplay({ count, size = 13 }: { count: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3].map((i) => (
        <Ionicons
          key={i}
          name="star"
          size={size}
          color={i <= count ? Colors.starFilled : Colors.starEmpty}
          style={i <= count ? {
            textShadowColor: 'rgba(255,207,72,0.5)',
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 4,
          } : undefined}
        />
      ))}
    </View>
  );
}

function ClassifiedStamp() {
  return (
    <View style={{
      position: 'absolute',
      right: 16,
      top: '50%',
      transform: [{ translateY: -14 }, { rotate: '-12deg' }],
      borderWidth: 2,
      borderColor: Colors.danger + '60',
      borderRadius: 4,
      paddingHorizontal: 8,
      paddingVertical: 2,
    }}>
      <Text style={{
        fontFamily: Fonts.heading,
        fontSize: 10,
        color: Colors.danger + '60',
        letterSpacing: 2,
      }}>CLASSIFIED</Text>
    </View>
  );
}

function PulsingDot({ color }: { color: string }) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[{
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: color,
    }, style]} />
  );
}

function CaseCard({
  level,
  progress,
  envColor,
  index,
  sectionIndex,
  onPress,
}: {
  level: typeof ALL_LEVELS[0];
  progress: PlayerProgress;
  envColor: string;
  index: number;
  sectionIndex: number;
  onPress: () => void;
}) {
  const result = progress.results[level.id];
  const isUnlocked = level.id <= progress.unlockedLevel;
  const isCompleted = result?.completed;
  const isNext = level.id === progress.unlockedLevel && !isCompleted;

  return (
    <Animated.View
      entering={FadeInDown.delay(sectionIndex * 80 + index * 50).duration(350)}
    >
      <TouchableOpacity
        disabled={!isUnlocked}
        onPress={onPress}
        activeOpacity={0.7}
        style={[
          styles.caseCard,
          !isUnlocked && styles.caseCardLocked,
          isNext && { borderColor: envColor + '50' },
        ]}
        accessible
        accessibilityRole="button"
        accessibilityLabel={`Case ${level.id}: ${level.name}${isCompleted ? `, completed with ${result?.stars} stars` : isUnlocked ? ', available' : ', locked'}`}
        accessibilityState={{ disabled: !isUnlocked }}
      >
        {/* Case number badge */}
        <View style={[
          styles.caseNumberBadge,
          isCompleted
            ? { backgroundColor: envColor + '20' }
            : isUnlocked
              ? { backgroundColor: Colors.bgElevated }
              : { backgroundColor: Colors.bgDark },
        ]}>
          {isUnlocked ? (
            <Text style={[
              styles.caseNumber,
              isCompleted && { color: envColor },
            ]}>
              {String(level.id).padStart(2, '0')}
            </Text>
          ) : (
            <Ionicons name="lock-closed" size={16} color={Colors.textLight} />
          )}
        </View>

        {/* Case info */}
        <View style={styles.caseInfo}>
          <View style={styles.caseTopRow}>
            <Text
              style={[
                styles.caseName,
                !isUnlocked && { color: Colors.textLight },
              ]}
              numberOfLines={1}
            >
              {level.name}
            </Text>
            {isNext && <PulsingDot color={envColor} />}
          </View>

          {isUnlocked && (
            <View style={styles.caseDetails}>
              <View style={styles.caseDetail}>
                <Ionicons name="time-outline" size={11} color={Colors.textLight} />
                <Text style={styles.caseDetailText}>{level.timeLimit}s</Text>
              </View>
              <View style={styles.caseDetail}>
                <Ionicons name="ellipse" size={4} color={Colors.textLight + '60'} />
              </View>
              <View style={styles.caseDetail}>
                <Text style={styles.caseDetailText}>
                  {level.stains.length} stains
                </Text>
              </View>
              <View style={styles.caseDetail}>
                <Ionicons name="ellipse" size={4} color={Colors.textLight + '60'} />
              </View>
              <View style={{ flexDirection: 'row', gap: 3 }}>
                {level.tools.map((t) => (
                  <Text key={t} style={{ fontSize: 11 }}>
                    {TOOLS[t].icon}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Right side — stars or classified */}
        {isUnlocked ? (
          <View style={styles.caseRight}>
            {isCompleted && result ? (
              <>
                <StarDisplay count={result.stars} />
                <Text style={styles.caseScore}>
                  {result.score.toLocaleString()}
                </Text>
              </>
            ) : (
              <View style={styles.newTag}>
                <Text style={styles.newTagText}>NEW</Text>
              </View>
            )}
          </View>
        ) : (
          <ClassifiedStamp />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function EnvironmentHeader({
  env,
  levels,
  progress,
  sectionIndex,
}: {
  env: EnvironmentType;
  levels: typeof ALL_LEVELS;
  progress: PlayerProgress;
  sectionIndex: number;
}) {
  const meta = ENV_META[env];
  const completedCount = levels.filter((l) => progress.results[l.id]?.completed).length;
  const totalStars = levels.reduce((sum, l) => sum + (progress.results[l.id]?.stars ?? 0), 0);
  const maxStars = levels.length * 3;

  return (
    <Animated.View
      entering={FadeInRight.delay(sectionIndex * 80).duration(350)}
      style={styles.envHeader}
    >
      <View style={[styles.envIconWrap, { backgroundColor: meta.color + '15' }]}>
        <Ionicons name={meta.icon} size={18} color={meta.color} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.envTitleRow}>
          <Text style={[styles.envLabel, { color: meta.color }]}>{meta.label}</Text>
          <Text style={styles.envProgress}>{completedCount}/{levels.length}</Text>
        </View>
        <View style={styles.envStarRow}>
          <View style={styles.envProgressTrack}>
            <View style={[
              styles.envProgressFill,
              {
                width: `${maxStars > 0 ? (totalStars / maxStars) * 100 : 0}%`,
                backgroundColor: meta.color,
              },
            ]} />
          </View>
          <Ionicons name="star" size={10} color={Colors.starFilled} />
          <Text style={styles.envStarText}>{totalStars}/{maxStars}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

export default function LevelSelect() {
  const router = useRouter();
  const { width: W } = useWindowDimensions();
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [lightsOn, setLightsOn] = useState(SoundManager.isPoliceLightsEnabled());

  useFocusEffect(
    useCallback(() => {
      loadProgress().then(setProgress);
      setLightsOn(SoundManager.isPoliceLightsEnabled());
    }, [])
  );

  if (!progress) return <View style={styles.container} />;

  const groups: { env: EnvironmentType; levels: typeof ALL_LEVELS }[] = [
    { env: 'apartment', levels: ALL_LEVELS.filter((l) => l.environment === 'apartment') },
    { env: 'warehouse', levels: ALL_LEVELS.filter((l) => l.environment === 'warehouse') },
    { env: 'office', levels: ALL_LEVELS.filter((l) => l.environment === 'office') },
  ];

  const totalCompleted = Object.values(progress.results).filter((r) => r.completed).length;
  const totalStars = Object.values(progress.results).reduce((sum, r) => sum + r.stars, 0);
  const maxStars = ALL_LEVELS.length * 3;

  return (
    <View style={styles.container}>
      {/* Police siren lights around Dynamic Island */}
      {lightsOn && <PoliceLights />}

      {/* Header */}
      <LinearGradient
        colors={[Colors.bgCard, Colors.bgElevated, Colors.bgDark]}
        locations={[0, 0.7, 1]}
        style={styles.header}
      >
        {/* Top nav row */}
        <View style={styles.headerNav}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessible accessibilityRole="button" accessibilityLabel="Go back">
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TouchableOpacity
              style={styles.scoreChip}
              onPress={() => router.push('/upgrades')}
            >
              <Ionicons name="construct" size={14} color={Colors.accent} />
            </TouchableOpacity>
            <View style={styles.scoreChip}>
              <Ionicons name="logo-usd" size={14} color={Colors.tertiary} />
              <Text style={styles.scoreText}>
                {progress.coins?.toLocaleString() ?? '0'}
              </Text>
            </View>
          </View>
        </View>

        {/* Big title area */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.headerCenter}>
          <Ionicons name="folder-open" size={28} color={Colors.primary} style={{ marginBottom: 6 }} />
          <Text style={styles.headerTitle}>CASE FILES</Text>
          <Text style={styles.headerSub}>
            {totalCompleted} of {ALL_LEVELS.length} cases cleared
          </Text>
        </Animated.View>

        {/* Overall progress */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.overallBar}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={16} color={Colors.starFilled} />
              <Text style={styles.statValue}>{totalStars}</Text>
              <Text style={styles.statMax}>/{maxStars}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.statValue}>{totalCompleted}</Text>
              <Text style={styles.statMax}>/{ALL_LEVELS.length}</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <LinearGradient
              colors={[Colors.primary, Colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.progressFill,
                { width: `${(totalCompleted / ALL_LEVELS.length) * 100}%` },
              ]}
            />
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Level list */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {groups.map((group, sectionIdx) => (
          <View key={group.env} style={styles.section}>
            <EnvironmentHeader
              env={group.env}
              levels={group.levels}
              progress={progress}
              sectionIndex={sectionIdx}
            />
            <View style={styles.cardList}>
              {group.levels.map((level, idx) => (
                <CaseCard
                  key={level.id}
                  level={level}
                  progress={progress}
                  envColor={ENV_META[group.env].color}
                  index={idx}
                  sectionIndex={sectionIdx}
                  onPress={() => router.push(`/game/${level.id}`)}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  // ── Header ──
  header: {
    paddingTop: 56,
    paddingBottom: 20,
    gap: 16,
  },
  headerNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderCurve: 'continuous',
  },
  headerCenter: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  headerTitle: {
    fontFamily: Fonts.heading,
    color: Colors.textPrimary,
    fontSize: 26,
    letterSpacing: 4,
    textShadowColor: 'rgba(191,255,0,0.15)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  headerSub: {
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderCurve: 'continuous',
  },
  scoreText: {
    fontFamily: Fonts.bodyBold,
    color: Colors.tertiary,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  // ── Overall progress ──
  overallBar: {
    paddingHorizontal: 20,
    gap: 10,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statValue: {
    fontFamily: Fonts.bodyBold,
    color: Colors.textPrimary,
    fontSize: 15,
    fontVariant: ['tabular-nums'],
  },
  statMax: {
    fontFamily: Fonts.body,
    color: Colors.textLight,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
  statDivider: {
    width: 1,
    height: 16,
    backgroundColor: Colors.textLight + '30',
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.bgDark,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  // ── Scroll ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // ── Section ──
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
    gap: 10,
  },
  // ── Env header ──
  envHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  envIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderCurve: 'continuous',
  },
  envTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  envLabel: {
    fontFamily: Fonts.heading,
    fontSize: 13,
    letterSpacing: 2,
  },
  envProgress: {
    fontFamily: Fonts.bodyBold,
    color: Colors.textLight,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  envStarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  envProgressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: Colors.bgElevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  envProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  envStarText: {
    fontFamily: Fonts.body,
    color: Colors.textLight,
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },
  // ── Card list ──
  cardList: {
    gap: 6,
  },
  // ── Case card ──
  caseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderCurve: 'continuous',
    padding: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.bgElevated,
  },
  caseCardLocked: {
    opacity: 0.45,
  },
  caseNumberBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderCurve: 'continuous',
    justifyContent: 'center',
    alignItems: 'center',
  },
  caseNumber: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  caseInfo: {
    flex: 1,
    gap: 4,
  },
  caseTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  caseName: {
    fontFamily: Fonts.bodyBold,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  caseDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  caseDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  caseDetailText: {
    fontFamily: Fonts.body,
    color: Colors.textLight,
    fontSize: 11,
  },
  caseRight: {
    alignItems: 'flex-end',
    gap: 3,
  },
  caseScore: {
    fontFamily: Fonts.body,
    color: Colors.textLight,
    fontSize: 10,
    fontVariant: ['tabular-nums'],
  },
  newTag: {
    backgroundColor: Colors.secondary + '20',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderCurve: 'continuous',
  },
  newTagText: {
    fontFamily: Fonts.bodyBold,
    color: Colors.secondary,
    fontSize: 9,
    letterSpacing: 1,
  },
});
