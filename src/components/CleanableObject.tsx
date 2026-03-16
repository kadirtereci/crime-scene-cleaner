import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Image, ImageSourcePropType } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { CleanableObjectData, ObjectType, STAIN_COLORS } from '../game/types';

const objectImages: Record<ObjectType, ImageSourcePropType> = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  sofa: require('../../assets/objects/sofa.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  carpet: require('../../assets/objects/carpet.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  table: require('../../assets/objects/table.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  wallSection: require('../../assets/objects/wall-section.png'),
};

interface CleanableObjectProps {
  object: CleanableObjectData;
  scrubbedSegmentIds?: Set<string>;
}

function SegmentOverlay({
  offsetX,
  offsetY,
  radius,
  dirtLevel,
  stainType,
  isScrubbed,
}: {
  offsetX: number;
  offsetY: number;
  radius: number;
  dirtLevel: number;
  stainType: string;
  isScrubbed: boolean;
}) {
  const opacity = useSharedValue(dirtLevel);
  const jitterX = useSharedValue(0);
  const jitterY = useSharedValue(0);
  const popScale = useSharedValue(1);
  const prevDirtRef = useRef(dirtLevel);

  useEffect(() => {
    const prevDirt = prevDirtRef.current;
    prevDirtRef.current = dirtLevel;

    if (dirtLevel <= 0.01 && prevDirt > 0.01) {
      // Pop animation on segment completion
      popScale.value = withSequence(
        withSpring(1.4, { damping: 6, stiffness: 400 }),
        withTiming(0, { duration: 200, easing: Easing.in(Easing.ease) })
      );
      opacity.value = withTiming(0, { duration: 250 });
      return;
    }

    opacity.value = withTiming(dirtLevel * 0.8, { duration: 100 });
  }, [dirtLevel]);

  // Jitter when being scrubbed
  useEffect(() => {
    if (isScrubbed && dirtLevel > 0.01) {
      jitterX.value = withRepeat(
        withSequence(
          withTiming(2, { duration: 30 }),
          withTiming(-2, { duration: 30 })
        ),
        -1,
        true
      );
      jitterY.value = withRepeat(
        withSequence(
          withTiming(-1.5, { duration: 25 }),
          withTiming(1.5, { duration: 25 })
        ),
        -1,
        true
      );
    } else {
      jitterX.value = withTiming(0, { duration: 50 });
      jitterY.value = withTiming(0, { duration: 50 });
    }
  }, [isScrubbed, dirtLevel > 0.01]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: jitterX.value },
      { translateY: jitterY.value },
      { scale: popScale.value },
    ],
  }));

  const color = STAIN_COLORS[stainType as keyof typeof STAIN_COLORS]?.[0] ?? '#8B6914';

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: offsetX - radius,
          top: offsetY - radius,
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          backgroundColor: color,
        },
        animStyle,
      ]}
      pointerEvents="none"
    />
  );
}

export default function CleanableObject({ object, scrubbedSegmentIds }: CleanableObjectProps) {
  const { position, width, height, segments, type } = object;

  return (
    <View
      style={[
        styles.container,
        {
          left: position.x - width / 2,
          top: position.y - height / 2,
          width,
          height,
        },
      ]}
      pointerEvents="none"
    >
      {/* Background image */}
      <Image
        source={objectImages[type]}
        style={{ width, height }}
        resizeMode="contain"
      />

      {/* Segment dirt overlays */}
      {segments.map((seg) => (
        <SegmentOverlay
          key={seg.id}
          offsetX={width / 2 + seg.offsetX}
          offsetY={height / 2 + seg.offsetY}
          radius={seg.radius}
          dirtLevel={seg.dirtLevel}
          stainType={seg.stainType}
          isScrubbed={scrubbedSegmentIds?.has(seg.id) ?? false}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
});
