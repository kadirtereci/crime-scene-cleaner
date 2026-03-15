import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ImageSourcePropType,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { HapticManager } from '../utils/hapticManager';
import { Analytics } from '../utils/analytics';

import {
  ToolType,
  TOOLS,
  UpgradeStat,
  PlayerProgress,
} from '../game/types';
import {
  getUpgradeCost,
  canAfford,
  getStatValue,
  MAX_UPGRADE_LEVEL,
} from '../game/upgradeSystem';
import { loadProgress, purchaseUpgrade } from '../game/progressStorage';
import { getTier, getTierColor } from '../game/tierSystem';
import { SoundManager } from '../audio/SoundManager';
import { Colors, Fonts } from '../theme';

const { width: W } = Dimensions.get('window');
const ALL_TOOLS: ToolType[] = ['mop', 'scrubBrush', 'trashBag', 'repairKit', 'spray'];

const toolImages: Record<ToolType, ImageSourcePropType> = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mop: require('../../assets/tools/mop.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  scrubBrush: require('../../assets/tools/scrub-brush.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  trashBag: require('../../assets/tools/trash-bag.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  repairKit: require('../../assets/tools/repair-kit.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  spray: require('../../assets/tools/spray.png'),
};

const STAT_META: Record<UpgradeStat, { icon: keyof typeof Ionicons.glyphMap; label: string; color: string }> = {
  power: { icon: 'flash', label: 'POWER', color: Colors.secondary },
  reach: { icon: 'resize', label: 'REACH', color: Colors.accent },
  speed: { icon: 'speedometer', label: 'SPEED', color: Colors.primary },
};

const STATS: UpgradeStat[] = ['power', 'reach', 'speed'];

function StatBar({
  toolType,
  stat,
  level,
  coins,
  onUpgrade,
  index,
}: {
  toolType: ToolType;
  stat: UpgradeStat;
  level: number;
  coins: number;
  onUpgrade: () => void;
  index: number;
}) {
  const meta = STAT_META[stat];
  const cost = getUpgradeCost(level);
  const maxed = cost === null;
  const affordable = !maxed && canAfford(coins, level);
  const currentVal = getStatValue(toolType, stat, level);
  const nextVal = !maxed ? getStatValue(toolType, stat, level + 1) : null;
  const fillPct = (level / MAX_UPGRADE_LEVEL) * 100;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 80).duration(300)}
      style={styles.statBar}
    >
      {/* Header row with inline action */}
      <View style={styles.statTopRow}>
        <View style={styles.statLabelRow}>
          <View style={[styles.statIconDot, { backgroundColor: meta.color + '20' }]}>
            <Ionicons name={meta.icon} size={13} color={meta.color} />
          </View>
          <Text style={styles.statLabel}>{meta.label}</Text>
        </View>
        <View style={styles.statRightCluster}>
          <Text style={styles.statValueText}>
            {currentVal}
            {nextVal && <Text style={{ color: Colors.primary }}>{' '}→ {nextVal}</Text>}
          </Text>
          {maxed ? (
            <View style={styles.maxChip}>
              <Ionicons name="checkmark-circle" size={10} color={Colors.tertiary} />
              <Text style={styles.maxChipText}>MAX</Text>
            </View>
          ) : affordable ? (
            <TouchableOpacity
              style={styles.upgradePill}
              onPress={onUpgrade}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Ionicons name="arrow-up" size={11} color={Colors.bgDark} />
              <Text style={styles.upgradePillText}>${cost}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.lockedCost}>
              <Ionicons name="logo-usd" size={10} color={Colors.textLight} />
              <Text style={styles.lockedCostText}>{cost}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${fillPct}%`, backgroundColor: meta.color }]} />
        {/* Pip markers */}
        {Array.from({ length: MAX_UPGRADE_LEVEL }, (_, i) => (
          <View
            key={i}
            style={[
              styles.barPipMark,
              { left: `${((i + 1) / MAX_UPGRADE_LEVEL) * 100}%` },
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

function ToolTab({
  toolType,
  isActive,
  totalLevel,
  onPress,
  index,
}: {
  toolType: ToolType;
  isActive: boolean;
  totalLevel: number;
  onPress: () => void;
  index: number;
}) {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withSpring(isActive ? 1.08 : 1, { damping: 12, stiffness: 150 });
  }, [isActive]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[styles.toolTab, isActive && styles.toolTabActive]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Image
          source={toolImages[toolType]}
          style={[styles.toolTabImg, isActive && styles.toolTabImgActive]}
          resizeMode="contain"
        />
        {totalLevel > 0 && (
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{totalLevel}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

function HeroGlow({ tier, tierColor }: { tier: number; tierColor: string }) {
  const glowSize = tier <= 2 ? (tier === 1 ? 60 : 70) : tier === 3 ? 80 : 90;
  const glowOpacity = tier <= 1 ? 0.12 : tier === 2 ? 0.18 : tier === 3 ? 0.25 : 0.3;

  const pulseScale = useSharedValue(1);

  React.useEffect(() => {
    if (tier >= 4) {
      pulseScale.value = withRepeat(
        withTiming(1.2, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulseScale.value = 1;
    }
  }, [tier]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
            backgroundColor: tierColor,
            opacity: glowOpacity,
          },
          tier >= 4 && pulseStyle,
        ]}
      />
      {tier >= 3 && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: glowSize + 20,
              height: glowSize + 20,
              borderRadius: (glowSize + 20) / 2,
              backgroundColor: tierColor,
              opacity: glowOpacity * 0.4,
            },
            tier >= 4 && pulseStyle,
          ]}
        />
      )}
    </>
  );
}

export default function UpgradeScreen() {
  const router = useRouter();
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolType>('mop');

  useFocusEffect(
    useCallback(() => {
      loadProgress().then(setProgress);
    }, [])
  );

  const handleUpgrade = async (stat: UpgradeStat) => {
    const { success, progress: updated } = await purchaseUpgrade(selectedTool, stat);
    if (success) {
      setProgress(updated);
      HapticManager.success();
      SoundManager.playSFX('starEarned');
      Analytics.track('upgrade_purchased', { tool: selectedTool, stat });
    } else {
      HapticManager.error();
      SoundManager.playSFX('reject');
    }
  };

  if (!progress) return <View style={styles.container} />;

  const toolUpgrades = progress.toolUpgrades[selectedTool];
  const toolConfig = TOOLS[selectedTool];
  const totalLevel = toolUpgrades.power + toolUpgrades.reach + toolUpgrades.speed;
  const tier = getTier(totalLevel);
  const tierColor = getTierColor(totalLevel);

  return (
    <View style={styles.container}>
      {/* Header gradient */}
      <LinearGradient
        colors={[Colors.bgCard, Colors.bgElevated, Colors.bgDark]}
        locations={[0, 0.7, 1]}
        style={styles.header}
      >
        {/* Nav row */}
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.coinChip}>
            <Ionicons name="logo-usd" size={14} color={Colors.tertiary} />
            <Text style={styles.coinText}>{progress.coins.toLocaleString()}</Text>
          </View>
        </View>

        {/* Title */}
        <Animated.View entering={FadeInDown.duration(350)} style={styles.titleArea}>
          <Ionicons name="construct" size={26} color={Colors.accent} style={{ marginBottom: 4 }} />
          <Text style={styles.headerTitle}>ARMORY</Text>
          <Text style={styles.headerSub}>Upgrade your tools to clean faster</Text>
        </Animated.View>

        {/* Tool tabs — horizontal row */}
        <Animated.View entering={FadeInDown.delay(100).duration(350)} style={styles.toolTabRow}>
          {ALL_TOOLS.map((t, i) => {
            const up = progress.toolUpgrades[t];
            const tl = up.power + up.reach + up.speed;
            return (
              <ToolTab
                key={t}
                toolType={t}
                isActive={t === selectedTool}
                totalLevel={tl}
                index={i}
                onPress={() => {
                  setSelectedTool(t);
                  SoundManager.playSFX('buttonTap');
                }}
              />
            );
          })}
        </Animated.View>
      </LinearGradient>

      {/* Tool detail */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tool hero */}
        <Animated.View entering={FadeInDown.delay(150).duration(350)} style={styles.heroCard}>
          <View style={styles.heroImgWrap}>
            {tier > 0 && (
              <HeroGlow tier={tier} tierColor={tierColor} />
            )}
            <Image
              source={toolImages[selectedTool]}
              style={styles.heroImg}
              resizeMode="contain"
            />
          </View>
          <View style={styles.heroInfo}>
            <Text style={styles.heroName}>{toolConfig.name}</Text>
            <Text style={styles.heroEmoji}>{toolConfig.icon}</Text>
            {totalLevel > 0 && (
              <View style={styles.heroLevelRow}>
                <Ionicons name="star" size={12} color={tier > 0 ? tierColor : Colors.primary} />
                <Text style={[styles.heroLevelText, tier > 0 && { color: tierColor }]}>Level {totalLevel}</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Stats */}
        <View style={styles.statsSection}>
          {STATS.map((stat, i) => (
            <StatBar
              key={`${selectedTool}-${stat}`}
              toolType={selectedTool}
              stat={stat}
              level={toolUpgrades[stat]}
              coins={progress.coins}
              onUpgrade={() => handleUpgrade(stat)}
              index={i}
            />
          ))}
        </View>

        {/* Hint text */}
        <Text style={styles.hintText}>
          Earn coins by completing levels. Stars give bonus coins!
        </Text>
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
    paddingBottom: 16,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  coinText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.tertiary,
    fontVariant: ['tabular-nums'],
  },
  titleArea: {
    alignItems: 'center',
    gap: 2,
    marginBottom: 16,
  },
  headerTitle: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    color: Colors.textPrimary,
    letterSpacing: 4,
    textShadowColor: 'rgba(0,212,255,0.15)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  headerSub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  // ── Tool tabs ──
  toolTabRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  toolTab: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  toolTabActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '12',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  toolTabImg: {
    width: 22,
    height: 34,
    opacity: 0.5,
  },
  toolTabImgActive: {
    opacity: 1,
  },
  levelBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: Colors.primary,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelBadgeText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    color: Colors.bgDark,
  },
  // ── Body ──
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  // ── Hero ──
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.bgElevated,
  },
  heroImgWrap: {
    width: 72,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // heroGlow is now rendered dynamically via HeroGlow component
  heroImg: {
    width: 48,
    height: 80,
  },
  heroInfo: {
    flex: 1,
    gap: 4,
  },
  heroName: {
    fontFamily: Fonts.heading,
    fontSize: 22,
    color: Colors.textPrimary,
    letterSpacing: 1,
  },
  heroEmoji: {
    fontSize: 22,
  },
  heroLevelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  heroLevelText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 12,
    color: Colors.primary,
  },
  // ── Stats ──
  statsSection: {
    gap: 12,
  },
  statBar: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.bgElevated,
    gap: 8,
  },
  statTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIconDot: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.textPrimary,
    letterSpacing: 1.5,
  },
  statValueText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  statRightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  // ── Bar ──
  barTrack: {
    height: 10,
    backgroundColor: Colors.bgDark,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  barPipMark: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: Colors.bgCard,
    marginLeft: -0.75,
  },
  // ── Inline actions ──
  upgradePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  upgradePillText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.bgDark,
  },
  lockedCost: {
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.45,
    gap: 2,
  },
  lockedCostText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.textLight,
  },
  maxChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.tertiary + '15',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.tertiary + '30',
  },
  maxChipText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.tertiary,
    letterSpacing: 2,
  },
  // ── Hint ──
  hintText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textLight,
    textAlign: 'center',
    marginTop: 24,
  },
});
