import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Position } from '../../game/types';

interface SparkleEffectProps {
  position: Position;
  onDone: () => void;
}

const PARTICLE_COUNT = 8;
const DURATION = 450;

function Particle({ position, angle, delay }: { position: Position; angle: number; delay: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: DURATION, easing: Easing.out(Easing.ease) })
    );
  }, []);

  const style = useAnimatedStyle(() => {
    const dist = progress.value * 40;
    const x = position.x + Math.cos(angle) * dist;
    const y = position.y + Math.sin(angle) * dist;
    const opacity = 1 - progress.value;
    const scale = 1 - progress.value * 0.6;
    return {
      transform: [{ translateX: x - 4 }, { translateY: y - 4 }, { scale }],
      opacity,
    };
  });

  const colors = ['#BFFF00', '#00D4FF', '#FF2D6F', '#39FF7F', '#FFCF48'];
  const color = colors[Math.floor(angle * 10) % colors.length];

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export default function SparkleEffect({ position, onDone }: SparkleEffectProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, DURATION + 100);
    return () => clearTimeout(timer);
  }, []);

  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    angle: (i / PARTICLE_COUNT) * Math.PI * 2,
    delay: i * 20,
  }));

  return (
    <>
      {particles.map((p, i) => (
        <Particle key={i} position={position} angle={p.angle} delay={p.delay} />
      ))}
    </>
  );
}
