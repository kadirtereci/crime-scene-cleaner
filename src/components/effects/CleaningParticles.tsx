import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Position, StainType, STAIN_COLORS } from '../../game/types';

interface CleaningParticlesProps {
  position: Position;
  stainType: StainType;
  onDone: () => void;
}

const PARTICLE_COUNT = 4;
const DURATION = 300;

function Particle({
  position,
  angle,
  stainType,
  index,
}: {
  position: Position;
  angle: number;
  stainType: StainType;
  index: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, {
      duration: DURATION,
      easing: Easing.out(Easing.ease),
    });
  }, []);

  const colors = STAIN_COLORS[stainType];
  const color = colors[index % colors.length];

  // Glass gets angular look, furniture gets rectangles
  const isGlass = stainType === 'glass';
  const isFurniture = stainType === 'furniture';

  const style = useAnimatedStyle(() => {
    const dist = progress.value * 18;
    const x = position.x + Math.cos(angle) * dist;
    const y = position.y + Math.sin(angle) * dist;
    const opacity = 1 - progress.value;
    const scale = 1 - progress.value * 0.5;
    return {
      transform: [
        { translateX: x - 2.5 },
        { translateY: y - 2.5 },
        { scale },
      ],
      opacity,
    };
  });

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: isFurniture ? 3 : 5,
          height: isFurniture ? 6 : 5,
          borderRadius: isGlass ? 1 : isFurniture ? 1 : 2.5,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export default function CleaningParticles({
  position,
  stainType,
  onDone,
}: CleaningParticlesProps) {
  useEffect(() => {
    const timer = setTimeout(onDone, DURATION + 50);
    return () => clearTimeout(timer);
  }, []);

  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    angle: (i / PARTICLE_COUNT) * Math.PI * 2 + Math.random() * 0.5,
  }));

  return (
    <>
      {particles.map((p, i) => (
        <Particle
          key={i}
          position={position}
          angle={p.angle}
          stainType={stainType}
          index={i}
        />
      ))}
    </>
  );
}
