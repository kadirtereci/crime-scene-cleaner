/**
 * ClueCollectedToast — mini banner + HUD glow pulse when a clue is auto-collected
 * Shows clue name briefly at the top, then pulses the HUD clue counter
 */
import React, { useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { ClueData } from '../game/storyTypes';
import { Colors, Fonts } from '../theme';

interface ClueCollectedToastProps {
  clue: ClueData;
  onDone: () => void;
}

export default function ClueCollectedToast({ clue, onDone }: ClueCollectedToastProps) {
  // Mini banner slides down from top
  const bannerY = useSharedValue(-60);
  const bannerOpacity = useSharedValue(0);

  // HUD glow
  const hudGlow = useSharedValue(0);

  useEffect(() => {
    // Banner slide in
    bannerOpacity.value = withTiming(1, { duration: 200 });
    bannerY.value = withSpring(0, { damping: 14, stiffness: 160 });

    // HUD glow pulse
    hudGlow.value = withDelay(100,
      withSequence(
        withTiming(1, { duration: 200 }),
        withTiming(0.3, { duration: 250 }),
        withTiming(1, { duration: 200 }),
        withTiming(0, { duration: 400 })
      )
    );

    // Banner slide out after 2.5s
    const timer = setTimeout(() => {
      bannerY.value = withTiming(-60, { duration: 250, easing: Easing.in(Easing.ease) });
      bannerOpacity.value = withDelay(100, withTiming(0, { duration: 200 }));
      setTimeout(onDone, 500);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const bannerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bannerY.value }],
    opacity: bannerOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: hudGlow.value,
    transform: [{ scale: 1 + hudGlow.value * 0.4 }],
  }));

  return (
    <View style={styles.root} pointerEvents="none">
      {/* Mini banner at top */}
      <Animated.View style={[styles.banner, bannerStyle]}>
        <Text style={styles.bannerIcon}>{clue.icon}</Text>
        <View style={styles.bannerText}>
          <Text style={styles.bannerTitle}>CLUE FOUND</Text>
          <Text style={styles.bannerName} numberOfLines={1}>{clue.name}</Text>
        </View>
      </Animated.View>

      {/* HUD glow overlay behind the clue chip */}
      <Animated.View style={[styles.hudGlow, glowStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  banner: {
    position: 'absolute',
    top: 96,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 207, 72, 0.15)',
    borderWidth: 1,
    borderColor: Colors.tertiary,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 8,
    shadowColor: Colors.tertiary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  bannerIcon: { fontSize: 20 },
  bannerText: { gap: 1 },
  bannerTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 9,
    color: Colors.tertiary,
    letterSpacing: 1.5,
  },
  bannerName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  hudGlow: {
    position: 'absolute',
    top: 48,
    right: 48,
    width: 70,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.tertiary,
    shadowColor: Colors.tertiary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
  },
});
