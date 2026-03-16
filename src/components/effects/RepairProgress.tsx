import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Position } from '../../game/types';
import { Colors, Fonts } from '../../theme';

interface RepairProgressProps {
  position: Position;
  progress: number; // 0-1
  visible: boolean;
}

const SIZE = 56;
const STROKE = 4;
const INNER = SIZE - STROKE * 2;

export default function RepairProgress({ position, progress, visible }: RepairProgressProps) {
  const animProgress = useSharedValue(0);
  const animOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      animProgress.value = withTiming(progress, { duration: 50, easing: Easing.linear });
      animOpacity.value = withTiming(1, { duration: 100 });
    } else {
      animOpacity.value = withTiming(0, { duration: 150 });
      animProgress.value = 0;
    }
  }, [progress, visible]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: animOpacity.value,
  }));

  // Radial progress using 4 quadrant clip approach
  // We'll use a simpler approach: circular border + fill segments
  const progressPercent = Math.round(progress * 100);

  if (!visible && progress <= 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: position.x - SIZE / 2,
          top: position.y - SIZE / 2 - 40, // above the stain
        },
        containerStyle,
      ]}
      pointerEvents="none"
    >
      {/* Background circle */}
      <View style={styles.bgCircle} />

      {/* Progress ring using quadrant overlays */}
      <View style={styles.ringContainer}>
        {/* Right half */}
        <View style={styles.halfClip}>
          <View
            style={[
              styles.halfCircle,
              {
                transform: [
                  { rotate: `${Math.min(progress * 360, 180)}deg` },
                ],
                opacity: progress > 0 ? 1 : 0,
              },
            ]}
          />
        </View>
        {/* Left half */}
        <View style={[styles.halfClip, styles.leftHalf]}>
          <View
            style={[
              styles.halfCircle,
              styles.leftHalfCircle,
              {
                transform: [
                  { rotate: `${Math.max(0, (progress - 0.5) * 360)}deg` },
                ],
                opacity: progress > 0.5 ? 1 : 0,
              },
            ]}
          />
        </View>
      </View>

      {/* Center text */}
      <View style={styles.centerCircle}>
        <Text style={styles.percentText}>{progressPercent}%</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgCircle: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: STROKE,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  ringContainer: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
  },
  halfClip: {
    position: 'absolute',
    width: SIZE / 2,
    height: SIZE,
    right: 0,
    overflow: 'hidden',
  },
  leftHalf: {
    right: undefined,
    left: 0,
  },
  halfCircle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: STROKE,
    borderColor: Colors.tertiary,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
    position: 'absolute',
    right: 0,
  },
  leftHalfCircle: {
    right: undefined,
    left: 0,
    borderColor: Colors.tertiary,
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
  },
  centerCircle: {
    width: INNER,
    height: INNER,
    borderRadius: INNER / 2,
    backgroundColor: 'rgba(15,14,23,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  percentText: {
    color: Colors.tertiary,
    fontSize: 12,
    fontFamily: Fonts.bodyBold,
    fontWeight: '800',
  },
});
