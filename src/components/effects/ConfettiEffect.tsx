import React, { useEffect, useMemo } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width: W } = Dimensions.get('window');

const PIECE_COUNT = 25;
const COLORS = ['#BFFF00', '#00D4FF', '#FF2D6F', '#39FF7F', '#FFCF48', '#6C5CE7', '#FF9F43'];

function ConfettiPiece({ index }: { index: number }) {
  const translateY = useSharedValue(-30);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  const startX = useMemo(() => Math.random() * W, []);
  const delay = useMemo(() => index * 60 + Math.random() * 200, []);
  const duration = useMemo(() => 1800 + Math.random() * 800, []);
  const drift = useMemo(() => (Math.random() - 0.5) * 100, []);
  const color = useMemo(() => COLORS[index % COLORS.length], []);
  const size = useMemo(() => 6 + Math.random() * 6, []);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(700, { duration, easing: Easing.in(Easing.ease) })
    );
    translateX.value = withDelay(
      delay,
      withTiming(drift, { duration, easing: Easing.inOut(Easing.ease) })
    );
    rotate.value = withDelay(
      delay,
      withTiming(360 * (Math.random() > 0.5 ? 1 : -1), { duration })
    );
    opacity.value = withDelay(
      delay + duration * 0.7,
      withTiming(0, { duration: duration * 0.3 })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          top: -20,
          width: size,
          height: size * 1.5,
          backgroundColor: color,
          borderRadius: 2,
        },
        style,
      ]}
    />
  );
}

export default function ConfettiEffect() {
  return (
    <>
      {Array.from({ length: PIECE_COUNT }, (_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </>
  );
}
