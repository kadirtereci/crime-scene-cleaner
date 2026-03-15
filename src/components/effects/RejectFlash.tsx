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
import { Colors } from '../../theme';

interface RejectFlashProps {
  position: Position;
  reason: 'wrongTool' | 'needsSpray';
  onDone: () => void;
}

const DURATION = 400;

export default function RejectFlash({ position, reason, onDone }: RejectFlashProps) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withTiming(1.3, { duration: DURATION * 0.4, easing: Easing.out(Easing.ease) });
    opacity.value = withTiming(0, { duration: DURATION, easing: Easing.in(Easing.ease) }, () => {
      runOnJS(onDone)();
    });
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: position.x - 16 },
      { translateY: position.y - 16 },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 32,
          height: 32,
          justifyContent: 'center',
          alignItems: 'center',
        },
        animStyle,
      ]}
      pointerEvents="none"
    >
      <Text style={{ fontSize: 22, color: Colors.danger }}>
        {reason === 'needsSpray' ? '🔒' : '✕'}
      </Text>
    </Animated.View>
  );
}
