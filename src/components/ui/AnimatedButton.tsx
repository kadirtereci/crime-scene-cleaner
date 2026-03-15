import React, { ReactNode } from 'react';
import { StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Colors, Fonts } from '../../theme';
import { HapticManager } from '../../utils/hapticManager';
import { SoundManager } from '../../audio/SoundManager';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const variantStyles: Record<Variant, { bg: string; text: string; border: string }> = {
  primary: { bg: Colors.primary, text: Colors.bgDark, border: Colors.primaryDark },
  secondary: { bg: Colors.secondary, text: '#fff', border: Colors.secondaryDark },
  ghost: { bg: 'transparent', text: Colors.textPrimary, border: Colors.textLight },
  danger: { bg: Colors.danger, text: '#fff', border: '#C0392B' },
};

interface AnimatedButtonProps {
  children: ReactNode;
  onPress: () => void;
  variant?: Variant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  label?: string;
  disabled?: boolean;
  accessibilityLabel?: string;
}

export default function AnimatedButton({
  children,
  onPress,
  variant = 'primary',
  style,
  textStyle,
  label,
  disabled = false,
  accessibilityLabel,
}: AnimatedButtonProps) {
  const scale = useSharedValue(1);
  const v = variantStyles[variant];

  const handlePress = () => {
    HapticManager.light();
    SoundManager.playSFX('buttonTap');
    onPress();
  };

  const tap = Gesture.Tap()
    .onBegin(() => {
      'worklet';
      scale.value = withSpring(0.92, { damping: 15, stiffness: 400 });
    })
    .onFinalize((_, success) => {
      'worklet';
      scale.value = withSpring(1, { damping: 10, stiffness: 300 });
      if (success && !disabled) {
        runOnJS(handlePress)();
      }
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View
        accessible
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled }}
        style={[
          styles.base,
          {
            backgroundColor: disabled ? Colors.textLight : v.bg,
            borderColor: disabled ? Colors.textLight : v.border,
          },
          variant === 'ghost' && styles.ghost,
          animStyle,
          style,
        ]}
      >
        {label ? (
          <Text style={[styles.text, { color: v.text }, textStyle]}>
            {label}
          </Text>
        ) : (
          children
        )}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
  },
  ghost: {
    borderBottomWidth: 0,
    borderWidth: 1.5,
  },
  text: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    letterSpacing: 1.5,
  },
});
