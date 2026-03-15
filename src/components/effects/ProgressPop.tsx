import React, { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Position } from '../../game/types';
import { Colors, Fonts } from '../../theme';

interface ProgressPopProps {
  position: Position;
  text: string;
  onDone: () => void;
}

const DURATION = 500;

export default function ProgressPop({ position, text, onDone }: ProgressPopProps) {
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withTiming(-20, { duration: DURATION, easing: Easing.out(Easing.ease) });
    opacity.value = withTiming(0, { duration: DURATION, easing: Easing.in(Easing.quad) }, () => {
      runOnJS(onDone)();
    });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: position.x - 20 },
      { translateY: position.y - 12 + translateY.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 40,
          alignItems: 'center',
        },
        animStyle,
      ]}
      pointerEvents="none"
    >
      <Text
        style={{
          fontFamily: Fonts.bodyBold,
          fontSize: 13,
          color: Colors.primary,
          textShadowColor: 'rgba(0,0,0,0.6)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 2,
        }}
      >
        {text}
      </Text>
    </Animated.View>
  );
}
