import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  useSharedValue,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { ComboTier } from '../../game/comboSystem';
import { Colors } from '../../theme';

const TIER_COLORS: Record<ComboTier, string> = {
  none: 'transparent',
  warm: Colors.accent,
  hot: Colors.warning,
  blazing: Colors.danger,
  inferno: Colors.tertiary,
};

const TIER_OPACITY: Record<ComboTier, number> = {
  none: 0,
  warm: 0.12,
  hot: 0.22,
  blazing: 0.32,
  inferno: 0.4,
};

interface ComboScreenEffectProps {
  comboTier: ComboTier;
}

export default function ComboScreenEffect({ comboTier }: ComboScreenEffectProps) {
  if (comboTier === 'none') return null;

  const color = TIER_COLORS[comboTier];
  const opacity = TIER_OPACITY[comboTier];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Top edge */}
      <View style={[styles.edge, styles.edgeTop, { backgroundColor: color, opacity }]} />
      {/* Bottom edge */}
      <View style={[styles.edge, styles.edgeBottom, { backgroundColor: color, opacity }]} />
      {/* Left edge */}
      <View style={[styles.edgeSide, styles.edgeLeft, { backgroundColor: color, opacity }]} />
      {/* Right edge */}
      <View style={[styles.edgeSide, styles.edgeRight, { backgroundColor: color, opacity }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  edge: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 40,
  },
  edgeTop: {
    top: 0,
  },
  edgeBottom: {
    bottom: 0,
  },
  edgeSide: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 20,
  },
  edgeLeft: {
    left: 0,
  },
  edgeRight: {
    right: 0,
  },
});
