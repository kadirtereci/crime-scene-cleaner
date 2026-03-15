import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { ComboTier } from '../game/comboSystem';
import { Colors, Fonts } from '../theme';

const TIER_BG: Record<ComboTier, string> = {
  none: Colors.accent,
  warm: Colors.accent,
  hot: Colors.warning,
  blazing: Colors.danger,
  inferno: Colors.tertiary,
};

const TIER_SCALE: Record<ComboTier, number> = {
  none: 1.0,
  warm: 1.0,
  hot: 1.05,
  blazing: 1.1,
  inferno: 1.15,
};

interface ComboDisplayProps {
  combo: number;
  multiplier: number;
  comboTier: ComboTier;
}

export default function ComboDisplay({ combo, multiplier, comboTier }: ComboDisplayProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-8);
  const rotate = useSharedValue(0);

  useEffect(() => {
    if (combo >= 2) {
      opacity.value = withTiming(1, { duration: 100 });
      translateY.value = withSpring(0, { damping: 12, stiffness: 300 });
      const targetScale = TIER_SCALE[comboTier];
      scale.value = withSequence(
        withSpring(targetScale + 0.3, { damping: 6, stiffness: 400 }),
        withSpring(targetScale, { damping: 10, stiffness: 200 })
      );
      if (combo >= 5) {
        rotate.value = withSequence(
          withTiming(6, { duration: 40 }),
          withTiming(-6, { duration: 40 }),
          withTiming(3, { duration: 40 }),
          withTiming(0, { duration: 60 })
        );
      }
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(-8, { duration: 200 });
      scale.value = withTiming(0.8, { duration: 200 });
    }
  }, [combo, comboTier]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  const bgColor = TIER_BG[comboTier];
  const isHigh = comboTier === 'blazing' || comboTier === 'inferno';
  const iconName = isHigh ? 'flame' : comboTier === 'hot' ? 'flame' : 'flash';

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor }, animStyle]} accessible accessibilityRole="text" accessibilityLabel={`Combo: ${combo}, multiplier ${multiplier.toFixed(1)}x`}>
      <Ionicons name={iconName} size={14} color="#fff" />
      <Text style={[styles.comboText, isHigh && styles.glowText]}>
        {combo}
      </Text>
      <Text style={[styles.multiplierText, isHigh && styles.glowText]}>
        {multiplier.toFixed(1)}x
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    minWidth: 60,
    justifyContent: 'center',
  },
  comboText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: Fonts.bodyBold,
    fontVariant: ['tabular-nums'],
  },
  multiplierText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    fontFamily: Fonts.body,
  },
  glowText: {
    textShadowColor: 'rgba(255,56,56,0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
