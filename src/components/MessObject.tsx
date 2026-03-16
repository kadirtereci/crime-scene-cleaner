/**
 * MessObject — renders a mess sprite that shrinks/fades as it's cleaned
 * Quick pop-and-vanish when fully cleaned. Key must include restartCount for proper reset.
 */
import React, { useEffect, useRef } from 'react';
import { Image, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { MessObjectData } from '../game/storyTypes';
import { MESS_SPRITES } from '../game/messSprites';

interface MessObjectProps {
  object: MessObjectData;
  isBeingScrubbed: boolean;
}

export default function MessObject({ object, isBeingScrubbed }: MessObjectProps) {
  const sprite = MESS_SPRITES[object.spriteId];

  const jitterX = useSharedValue(0);
  const gone = useRef(false);
  const animScale = useSharedValue(1);
  const animOpacity = useSharedValue(1);

  // Scrub jitter
  useEffect(() => {
    if (!sprite) return;
    if (isBeingScrubbed && object.dirtLevel > 0.01) {
      jitterX.value = withSequence(
        withTiming(-2, { duration: 40 }),
        withTiming(2, { duration: 40 }),
        withTiming(-1, { duration: 40 }),
        withTiming(1, { duration: 40 }),
        withTiming(0, { duration: 40 })
      );
    } else {
      jitterX.value = withTiming(0, { duration: 50 });
    }
  }, [isBeingScrubbed]);

  // When fully cleaned: quick pop-up then shrink to nothing
  useEffect(() => {
    if (!sprite) return;
    if (object.dirtLevel <= 0.01 && !gone.current) {
      gone.current = true;
      animScale.value = withSequence(
        withTiming(1.25, { duration: 100, easing: Easing.out(Easing.ease) }),
        withTiming(0, { duration: 200, easing: Easing.in(Easing.ease) })
      );
      animOpacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(0, { duration: 200 })
      );
    }
  }, [object.dirtLevel]);

  const dirtScale = gone.current ? 1 : Math.max(0.5, object.dirtLevel);
  const dirtOpacity = gone.current ? 1 : Math.max(0.15, object.dirtLevel);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: gone.current ? animOpacity.value : dirtOpacity,
    transform: [
      { translateX: jitterX.value },
      { scale: gone.current ? animScale.value : dirtScale },
    ],
  }));

  // Early returns AFTER all hooks
  if (!sprite) return null;
  if (gone.current && object.dirtLevel <= 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: object.position.x - object.width / 2,
          top: object.position.y - object.height / 2,
          width: object.width,
          height: object.height,
        },
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <Image source={sprite.source} style={styles.sprite} resizeMode="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sprite: {
    width: '100%',
    height: '100%',
  },
});
