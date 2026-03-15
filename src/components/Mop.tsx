import React, { useEffect } from 'react';
import { StyleSheet, Image, ImageSourcePropType, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  SharedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { ToolType, TOOLS } from '../game/types';
import { ComboTier } from '../game/comboSystem';
import { getTier, getTierColor } from '../game/tierSystem';
import { Colors } from '../theme';

const COMBO_RING_COLORS: Record<ComboTier, string> = {
  none: Colors.accent,
  warm: Colors.accent,
  hot: Colors.warning,
  blazing: Colors.danger,
  inferno: Colors.tertiary,
};

const toolImages: Record<ToolType, ImageSourcePropType> = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mop: require('../../assets/tools/mop.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  scrubBrush: require('../../assets/tools/scrub-brush.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  trashBag: require('../../assets/tools/trash-bag.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  repairKit: require('../../assets/tools/repair-kit.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  spray: require('../../assets/tools/spray.png'),
};

interface MopProps {
  x: SharedValue<number>;
  y: SharedValue<number>;
  angle: SharedValue<number>;
  visible: boolean;
  tool?: ToolType;
  isCleaning?: boolean;
  comboTier?: ComboTier;
  reachOverride?: number;
  totalLevel?: number;
}

const TOOL_W = 44;
const TOOL_H = 130;

export default function Mop({ x, y, angle, visible, tool = 'mop', isCleaning = false, comboTier = 'none', reachOverride, totalLevel = 0 }: MopProps) {
  const toolConfig = TOOLS[tool];
  const radius = reachOverride ?? toolConfig.reach;
  const tier = getTier(totalLevel);
  const tierColor = getTierColor(totalLevel);

  // Pulsing ring
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.3);

  // Per-tool animation values
  const toolAnimOffset = useSharedValue(0);
  const toolAnimScale = useSharedValue(1);

  // Tier glow pulse
  const tierGlowScale = useSharedValue(1);

  useEffect(() => {
    if (tier >= 4 && visible) {
      tierGlowScale.value = withRepeat(
        withTiming(1.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      tierGlowScale.value = 1;
    }
  }, [tier, visible]);

  const tierGlowStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value - 24 },
      { translateY: y.value - 24 - 20 },
      { scale: tierGlowScale.value },
    ],
  }));

  const pulseDuration = isCleaning ? 400 : 600;

  useEffect(() => {
    if (visible) {
      ringScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: pulseDuration, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: pulseDuration, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      ringOpacity.value = withRepeat(
        withSequence(
          withTiming(0.3, { duration: pulseDuration }),
          withTiming(0.6, { duration: pulseDuration })
        ),
        -1,
        true
      );

      // Subtle per-tool animations
      switch (tool) {
        case 'mop':
          // Gentle tilt oscillation ±3° (in radians ~0.052)
          toolAnimOffset.value = withRepeat(
            withSequence(
              withTiming(0.052, { duration: 400, easing: Easing.inOut(Easing.ease) }),
              withTiming(-0.052, { duration: 400, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
          );
          break;
        case 'scrubBrush':
          // Light jitter ±1.5px
          toolAnimOffset.value = withRepeat(
            withSequence(
              withTiming(1.5, { duration: 50 }),
              withTiming(-1.5, { duration: 50 })
            ),
            -1,
            true
          );
          break;
        case 'trashBag':
          // Subtle bounce
          toolAnimScale.value = withRepeat(
            withSequence(
              withTiming(1.02, { duration: 300, easing: Easing.inOut(Easing.ease) }),
              withTiming(1.0, { duration: 300, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
          );
          break;
        case 'repairKit':
          // Gentle vertical tap
          toolAnimOffset.value = withRepeat(
            withSequence(
              withTiming(-2, { duration: 180, easing: Easing.out(Easing.ease) }),
              withTiming(0, { duration: 180, easing: Easing.in(Easing.ease) })
            ),
            -1,
            true
          );
          break;
        case 'spray':
          toolAnimOffset.value = 0;
          break;
      }
    } else {
      toolAnimOffset.value = 0;
      toolAnimScale.value = 1;
    }
  }, [visible, tool, isCleaning]);

  // Smooth rotation via spring
  const smoothAngle = useSharedValue(0);
  useEffect(() => {
    // Reset smooth angle when tool changes
    smoothAngle.value = 0;
  }, [tool]);

  const toolStyle = useAnimatedStyle(() => {
    // Spring-damped rotation toward current drag angle
    smoothAngle.value = withSpring(angle.value, { damping: 20, stiffness: 80 });

    const transforms: any[] = [
      { translateX: x.value - TOOL_W / 2 },
      { translateY: y.value - TOOL_H / 2 - 20 },
    ];

    switch (tool) {
      case 'mop':
        // Rotation + tilt oscillation
        transforms.push({ rotate: `${smoothAngle.value + toolAnimOffset.value}rad` });
        break;
      case 'scrubBrush':
        // Rotation + x-axis jitter
        transforms.push({ rotate: `${smoothAngle.value}rad` });
        transforms.push({ translateX: toolAnimOffset.value });
        break;
      case 'trashBag':
        // No rotation, bounce scale
        transforms.push({ scale: toolAnimScale.value });
        break;
      case 'repairKit':
        // No rotation, vertical bounce
        transforms.push({ translateY: toolAnimOffset.value });
        break;
      case 'spray':
        // No rotation lock
        break;
    }

    return { transform: transforms };
  });

  const ringStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value - radius },
      { translateY: y.value - radius },
      { scale: ringScale.value },
    ],
    opacity: ringOpacity.value,
  }));

  if (!visible) return null;

  return (
    <>
      {/* Cleaning radius indicator */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: radius * 2,
            height: radius * 2,
            borderRadius: radius,
            borderWidth: 2,
            borderColor: isCleaning ? (comboTier !== 'none' ? COMBO_RING_COLORS[comboTier] : Colors.primary) : Colors.accent,
            backgroundColor: isCleaning ? 'rgba(191,255,0,0.12)' : 'rgba(0,212,255,0.08)',
          },
          ringStyle,
        ]}
        pointerEvents="none"
      />
      {/* Tier glow behind tool */}
      {tier >= 3 && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: tierColor,
              opacity: tier === 3 ? 0.2 : 0.3,
              zIndex: 99,
            },
            tierGlowStyle,
          ]}
          pointerEvents="none"
        />
      )}
      {/* Tool sprite */}
      <Animated.View style={[styles.mop, toolStyle]} pointerEvents="none">
        <View style={[
          styles.toolShadow,
          tier > 0 && {
            shadowColor: tierColor,
            shadowRadius: tier <= 2 ? (tier === 1 ? 4 : 8) : 12,
            shadowOpacity: tier <= 2 ? 0.5 : 0.7,
          },
        ]}>
          <Image
            source={toolImages[tool]}
            style={{ width: TOOL_W, height: TOOL_H }}
            resizeMode="contain"
          />
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  mop: {
    position: 'absolute',
    zIndex: 100,
  },
  toolShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
  },
});
