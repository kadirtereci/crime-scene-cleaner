import React, { useEffect } from 'react';
import { StyleSheet, Text, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { ComboTier } from '../../game/comboSystem';
import { Colors, Fonts } from '../../theme';

const { width: W, height: H } = Dimensions.get('window');

const TIER_LABELS: Record<ComboTier, string> = {
  none: '',
  warm: 'COMBO!',
  hot: 'HOT!',
  blazing: 'BLAZING!',
  inferno: 'INFERNO!',
};

const TIER_COLORS: Record<ComboTier, string> = {
  none: 'transparent',
  warm: Colors.accent,
  hot: Colors.warning,
  blazing: Colors.danger,
  inferno: Colors.tertiary,
};

interface Props {
  tier: ComboTier;
  onDone: () => void;
}

export default function ComboTierAnnouncement({ tier, onDone }: Props) {
  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withSpring(1.2, { damping: 6, stiffness: 300 }),
      withSpring(1.0, { damping: 10, stiffness: 200 })
    );
    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(1, { duration: 400 }),
      withTiming(0, { duration: 200, easing: Easing.in(Easing.ease) }, () => {
        runOnJS(onDone)();
      })
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const color = TIER_COLORS[tier];

  return (
    <Animated.View style={[styles.container, animStyle]} pointerEvents="none">
      <Text style={[styles.text, { color, textShadowColor: color + '80' }]}>
        {TIER_LABELS[tier]}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: H * 0.35,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 60,
  },
  text: {
    fontFamily: Fonts.heading,
    fontSize: 42,
    letterSpacing: 4,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
});
