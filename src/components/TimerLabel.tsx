import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts } from '../theme';

interface TimerLabelProps {
  seconds: number;
}

export default function TimerLabel({ seconds }: TimerLabelProps) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  const formatted = `${mins}:${secs.toString().padStart(2, '0')}`;
  const isLow = seconds <= 10;
  const isCritical = seconds <= 5;

  const pulse = useSharedValue(1);

  useEffect(() => {
    if (isCritical) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 250, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 250, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else if (isLow) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 400 }),
          withTiming(1, { duration: 400 })
        ),
        -1,
        true
      );
    } else {
      pulse.value = 1;
    }
  }, [isLow, isCritical]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View
      style={[styles.wrapper, animStyle]}
      accessible
      accessibilityRole="timer"
      accessibilityLabel={`Time remaining: ${mins} minutes ${secs} seconds`}
      accessibilityLiveRegion="assertive"
    >
      <Ionicons
        name="time-outline"
        size={18}
        color={isLow ? Colors.danger : Colors.textSecondary}
      />
      <Text style={[styles.timer, isLow && styles.timerLow]}>
        {formatted}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  timer: {
    color: Colors.textPrimary,
    fontFamily: Fonts.heading,
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  timerLow: {
    color: Colors.danger,
    textShadowColor: 'rgba(255,56,56,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
});
