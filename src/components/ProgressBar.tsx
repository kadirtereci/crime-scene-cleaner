import React from 'react';
import { StyleSheet, View, Text, LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Fonts } from '../theme';

interface ProgressBarProps {
  progress: number;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  const pct = Math.round(progress * 100);
  const trackWidth = useSharedValue(0);

  const onTrackLayout = (e: LayoutChangeEvent) => {
    trackWidth.value = e.nativeEvent.layout.width;
  };

  const fillStyle = useAnimatedStyle(() => ({
    width: withTiming(trackWidth.value * progress, { duration: 200 }),
  }));

  return (
    <View style={styles.wrapper} accessible accessibilityRole="progressbar" accessibilityLabel={`Cleaning progress: ${pct} percent`} accessibilityValue={{ min: 0, max: 100, now: pct }}>
      <Text style={styles.label}>CLEANED</Text>
      <View style={styles.track} onLayout={onTrackLayout}>
        <Animated.View style={[styles.fill, fillStyle]}>
          <LinearGradient
            colors={[Colors.accent, Colors.success]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.shimmer} />
        </Animated.View>
      </View>
      <Text style={[styles.pct, pct === 100 && styles.pctDone]}>{pct}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  label: {
    color: Colors.textSecondary,
    fontSize: 10,
    fontFamily: Fonts.bodyBold,
    letterSpacing: 1,
  },
  track: {
    flex: 1,
    height: 10,
    backgroundColor: Colors.bgElevated,
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 4,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
  },
  pct: {
    color: Colors.accent,
    fontSize: 13,
    fontFamily: Fonts.bodyBold,
    width: 38,
    textAlign: 'right',
  },
  pctDone: {
    color: Colors.success,
  },
});
