import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LevelResult } from '../game/types';
import { calculateCoins } from '../game/upgradeSystem';
import { Colors, Fonts } from '../theme';
import ConfettiEffect from './effects/ConfettiEffect';

const { width: W } = Dimensions.get('window');

interface ResultScreenProps {
  result: LevelResult;
  levelName: string;
  hasNextLevel: boolean;
  onRestart: () => void;
  onNext: () => void;
  onMenu: () => void;
  onUpgrades?: () => void;
}

function AnimatedStar({ index, filled }: { index: number; filled: boolean }) {
  const scale = useSharedValue(0);

  useEffect(() => {
    if (filled) {
      scale.value = withDelay(400 + index * 250, withSpring(1, { damping: 8, stiffness: 200 }));
    } else {
      scale.value = withDelay(400 + index * 250, withTiming(1, { duration: 200 }));
    }
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={style}>
      <Ionicons
        name="star"
        size={44}
        color={filled ? Colors.starFilled : Colors.starEmpty}
        style={filled ? {
          textShadowColor: 'rgba(255,207,72,0.6)',
          textShadowRadius: 8,
          textShadowOffset: { width: 0, height: 0 },
        } : undefined}
      />
    </Animated.View>
  );
}

function CountUpScore({ target }: { target: number }) {
  const [displayed, setDisplayed] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const DELAY = 600;
    const DURATION = 800;

    const timeout = setTimeout(() => {
      const animate = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp;
        }
        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / DURATION, 1);
        setDisplayed(Math.round(progress * target));

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(animate);
        }
      };
      rafRef.current = requestAnimationFrame(animate);
    }, DELAY);

    return () => {
      clearTimeout(timeout);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target]);

  return <Text style={styles.statValue}>{displayed}</Text>;
}

export default function ResultScreen({
  result,
  levelName,
  hasNextLevel,
  onRestart,
  onNext,
  onMenu,
  onUpgrades,
}: ResultScreenProps) {
  const won = result.completed;
  const coinsEarned = calculateCoins(result.score, result.stars);

  return (
    <View style={styles.overlay}>
      {/* Confetti */}
      {won && <ConfettiEffect />}

      <Animated.View
        entering={FadeInUp.springify().damping(14).stiffness(120)}
        style={[styles.card, won ? styles.cardWon : styles.cardLost]}
      >
        {/* Icon */}
        <Ionicons
          name={won ? 'checkmark-circle' : 'time'}
          size={52}
          color={won ? Colors.success : Colors.danger}
        />

        <Text style={styles.title}>
          {won ? 'SCENE CLEANED!' : "TIME'S UP!"}
        </Text>
        <Text style={styles.levelName}>{levelName}</Text>

        {/* Stars */}
        {won && (
          <View style={styles.starRow}>
            {[1, 2, 3].map((i) => (
              <AnimatedStar key={i} index={i - 1} filled={i <= result.stars} />
            ))}
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsBox}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Score</Text>
            <CountUpScore target={result.score} />
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statValue}>{result.timeUsed}s</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Max Combo</Text>
            <Text style={styles.statValue}>×{result.maxCombo}</Text>
          </View>
          <View style={[styles.statRow, { borderTopWidth: 1, borderTopColor: Colors.bgCard, paddingTop: 8 }]}>
            <Text style={[styles.statLabel, { color: Colors.tertiary }]}>
              <Ionicons name="logo-usd" size={13} color={Colors.tertiary} /> Coins
            </Text>
            <Text style={[styles.statValue, { color: Colors.tertiary }]}>+{coinsEarned}</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          {won && hasNextLevel && (
            <TouchableOpacity style={styles.nextBtn} onPress={onNext} accessible accessibilityRole="button" accessibilityLabel="Next level">
              <Text style={styles.nextText}>NEXT</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.bgDark} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.retryBtn} onPress={onRestart} accessible accessibilityRole="button" accessibilityLabel={won ? 'Retry level' : 'Try again'}>
            <Ionicons name="refresh" size={18} color={Colors.textPrimary} />
            <Text style={styles.retryText}>{won ? 'RETRY' : 'TRY AGAIN'}</Text>
          </TouchableOpacity>
          {onUpgrades && (
            <TouchableOpacity style={styles.upgradeBtn} onPress={onUpgrades} accessible accessibilityRole="button" accessibilityLabel="Open upgrades">
              <Ionicons name="construct" size={16} color={Colors.accent} />
              <Text style={styles.upgradeText}>UPGRADES</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.menuBtn} onPress={onMenu} accessible accessibilityRole="button" accessibilityLabel="Return to menu">
            <Text style={styles.menuText}>MENU</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  card: {
    width: W * 0.85,
    borderRadius: 24,
    padding: 26,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.bgElevated,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  cardWon: {
    backgroundColor: Colors.bgCard,
  },
  cardLost: {
    backgroundColor: Colors.bgCard,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontFamily: Fonts.heading,
    fontWeight: '900',
    letterSpacing: 2,
    marginTop: 6,
  },
  levelName: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: Fonts.body,
    marginTop: 4,
    marginBottom: 10,
  },
  starRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statsBox: {
    width: '100%',
    backgroundColor: Colors.bgElevated,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginBottom: 18,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontFamily: Fonts.body,
    fontWeight: '600',
  },
  statValue: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontFamily: Fonts.bodyBold,
    fontWeight: '800',
  },
  buttons: {
    width: '100%',
    gap: 10,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
  },
  nextText: {
    color: Colors.bgDark,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.bgElevated,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.bgElevated,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.accent + '30',
  },
  upgradeText: {
    color: Colors.accent,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  menuBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  menuText: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
});
