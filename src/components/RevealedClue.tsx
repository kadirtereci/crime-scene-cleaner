/**
 * RevealedClue — when a mess is cleaned and reveals a clue, the icon
 * pops in at the clue position, pauses briefly, then flies up to the
 * HUD clue counter with a golden trail. No tap required.
 */
import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { ClueData } from '../game/storyTypes';
import { Colors } from '../theme';

interface RevealedClueProps {
  clue: ClueData;
  onCollect: (clueId: string) => void;
}

export default function RevealedClue({ clue, onCollect }: RevealedClueProps) {
  const { width: W } = useWindowDimensions();
  const collected = useRef(false);

  const popScale = useSharedValue(0);
  const popOpacity = useSharedValue(1);
  const glowRadius = useSharedValue(0);
  const flyX = useSharedValue(0);
  const flyY = useSharedValue(0);
  const flyScale = useSharedValue(1);

  const hudTargetX = W - 100 - clue.position.x;
  const hudTargetY = 58 - clue.position.y;

  useEffect(() => {
    if (!clue.revealed || clue.collected) return;

    // Phase 1: Pop in with golden glow (0 → 800ms)
    popScale.value = withSpring(1.2, { damping: 6, stiffness: 180 });
    glowRadius.value = withSequence(
      withTiming(20, { duration: 400 }),
      withTiming(8, { duration: 400 })
    );

    // Phase 2: Fly to HUD (at 900ms)
    const flyDelay = 900;

    flyScale.value = withDelay(flyDelay,
      withSequence(
        withTiming(1.5, { duration: 120 }),
        withTiming(0.5, { duration: 500, easing: Easing.bezier(0.4, 0, 0.2, 1) })
      )
    );

    flyX.value = withDelay(flyDelay + 120,
      withTiming(hudTargetX, {
        duration: 500,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      })
    );
    flyY.value = withDelay(flyDelay + 120,
      withTiming(hudTargetY, {
        duration: 500,
        easing: Easing.bezier(0.4, 0, 0.2, 1),
      })
    );

    popOpacity.value = withDelay(flyDelay + 500, withTiming(0, { duration: 120 }));

    const timer = setTimeout(() => {
      if (!collected.current) {
        collected.current = true;
        onCollect(clue.id);
      }
    }, flyDelay + 650);

    return () => clearTimeout(timer);
  }, [clue.revealed]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: popOpacity.value,
    transform: [
      { translateX: flyX.value },
      { translateY: flyY.value },
      { scale: popScale.value * flyScale.value },
    ],
    shadowRadius: glowRadius.value,
  }));

  // Early return AFTER all hooks
  if (!clue.revealed || clue.collected) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          left: clue.position.x - 28,
          top: clue.position.y - 28,
        },
        animStyle,
      ]}
      pointerEvents="none"
    >
      <Text style={styles.icon}>{clue.icon}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 207, 72, 0.3)',
    borderWidth: 2,
    borderColor: Colors.tertiary,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 30,
    shadowColor: Colors.tertiary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    elevation: 10,
  },
  icon: {
    fontSize: 26,
  },
});
