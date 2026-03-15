import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Image, ImageSourcePropType, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { StainData, StainType, STAIN_COLORS } from '../game/types';

const stainImages: Record<StainType, ImageSourcePropType> = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  blood: require('../../assets/stains/blood-stain.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  glass: require('../../assets/stains/broken-glass.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  trash: require('../../assets/stains/trash.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  evidence: require('../../assets/stains/evidence.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  furniture: require('../../assets/stains/broken-furniture.png'),
};

interface StainProps {
  stain: StainData;
  isBeingScrubbed?: boolean;
}

/** Per-type animation config derived from dirtLevel */
function getTypeAnimConfig(
  type: StainType,
  dirtLevel: number
): {
  scaleX: number;
  scaleY: number;
  opacity: number;
  rotate: number;
  translateX: number;
  translateY: number;
} {
  switch (type) {
    case 'blood':
      return {
        scaleX: dirtLevel < 0.3 ? 0.7 + dirtLevel * 1.0 : 1.0,
        scaleY: dirtLevel < 0.3 ? 0.7 + dirtLevel * 1.0 : 1.0,
        opacity: Math.max(0.4, dirtLevel * 0.6 + 0.4),
        rotate: 0,
        translateX: 0,
        translateY: 0,
      };
    case 'glass':
      return {
        scaleX: 0.7 + dirtLevel * 0.3,
        scaleY: 0.7 + dirtLevel * 0.3,
        opacity: Math.max(0.4, dirtLevel * 0.5 + 0.5),
        rotate: 0,
        translateX: 0,
        translateY: 0,
      };
    case 'trash':
      return {
        scaleX: 0.5 + dirtLevel * 0.5,
        scaleY: 0.7 + dirtLevel * 0.3,
        opacity: Math.max(0.4, dirtLevel * 0.5 + 0.5),
        rotate: (1 - dirtLevel) * 0.15,
        translateX: 0,
        translateY: 0,
      };
    case 'evidence':
      return {
        scaleX: dirtLevel < 0.2 ? 0.8 : 0.7 + dirtLevel * 0.3,
        scaleY: 0.7 + dirtLevel * 0.3,
        opacity: Math.max(0.4, dirtLevel * 0.5 + 0.4),
        rotate: 0,
        translateX: 0,
        translateY: (1 - dirtLevel) * 15,
      };
    case 'furniture':
      return {
        scaleX: dirtLevel < 0.3 ? 0.7 + dirtLevel * 1.0 : 1.0,
        scaleY: dirtLevel < 0.3 ? 0.7 + dirtLevel * 1.0 : 1.0,
        opacity: Math.max(0.4, dirtLevel * 0.5 + 0.5),
        rotate: dirtLevel * 0.2,
        translateX: 0,
        translateY: 0,
      };
    default:
      return {
        scaleX: 0.7 + dirtLevel * 0.3,
        scaleY: 0.7 + dirtLevel * 0.3,
        opacity: Math.max(0.4, dirtLevel * 0.5 + 0.5),
        rotate: 0,
        translateX: 0,
        translateY: 0,
      };
  }
}

// Glass shard offsets (fixed positions, spread based on dirtLevel)
const SHARD_ANGLES = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];
const SHARD_ROTATIONS = [0.3, -0.5, 0.8, -0.2];

export default function Stain({ stain, isBeingScrubbed = false }: StainProps) {
  const animScaleX = useSharedValue(1);
  const animScaleY = useSharedValue(1);
  const animOpacity = useSharedValue(1);
  const animRotate = useSharedValue(0);
  const animTranslateX = useSharedValue(0);
  const animTranslateY = useSharedValue(0);
  const pulseScale = useSharedValue(1);
  const jitterX = useSharedValue(0);
  const jitterY = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const prevDirtRef = useRef(stain.dirtLevel);
  const bloodSpreadDone = useRef(false);

  useEffect(() => {
    const prevDirt = prevDirtRef.current;
    prevDirtRef.current = stain.dirtLevel;

    if (stain.dirtLevel <= 0.01 && prevDirt > 0.01) {
      // Pop animation on full clean
      animScaleX.value = withSequence(
        withSpring(1.3, { damping: 6, stiffness: 400 }),
        withTiming(0, { duration: 200, easing: Easing.in(Easing.ease) })
      );
      animScaleY.value = withSequence(
        withSpring(1.3, { damping: 6, stiffness: 400 }),
        withTiming(0, { duration: 200, easing: Easing.in(Easing.ease) })
      );
      animOpacity.value = withTiming(0, { duration: 250 });
      return;
    }

    const config = getTypeAnimConfig(stain.type, stain.dirtLevel);
    animScaleX.value = withTiming(config.scaleX, { duration: 100 });
    animScaleY.value = withTiming(config.scaleY, { duration: 100 });
    animOpacity.value = withTiming(config.opacity, { duration: 100 });
    animRotate.value = withTiming(config.rotate, { duration: 100 });
    animTranslateX.value = withTiming(config.translateX, { duration: 100 });
    animTranslateY.value = withTiming(config.translateY, { duration: 100 });

    // Blood: brief spread when first mopped
    if (
      stain.type === 'blood' &&
      !bloodSpreadDone.current &&
      stain.dirtLevel < 0.8 &&
      prevDirt >= 0.8
    ) {
      bloodSpreadDone.current = true;
      pulseScale.value = withSequence(
        withTiming(1.05, { duration: 80 }),
        withTiming(1.0, { duration: 100 })
      );
    }

    // Cleaning pulse on dirt decrease
    if (stain.dirtLevel < prevDirt && stain.dirtLevel > 0.01) {
      pulseScale.value = withSequence(
        withTiming(1.06, { duration: 60 }),
        withTiming(1.0, { duration: 80 })
      );
    }
  }, [stain.dirtLevel]);

  // Jitter when being scrubbed (increased amplitude)
  useEffect(() => {
    if (isBeingScrubbed && stain.dirtLevel > 0.01) {
      jitterX.value = withRepeat(
        withSequence(
          withTiming(2.5, { duration: 30 }),
          withTiming(-2.5, { duration: 30 })
        ),
        -1,
        true
      );
      jitterY.value = withRepeat(
        withSequence(
          withTiming(-2.0, { duration: 25 }),
          withTiming(2.0, { duration: 25 })
        ),
        -1,
        true
      );
      glowOpacity.value = withTiming(0.7, { duration: 100 });
    } else {
      jitterX.value = withTiming(0, { duration: 50 });
      jitterY.value = withTiming(0, { duration: 50 });
      glowOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [isBeingScrubbed, stain.dirtLevel > 0.01]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: jitterX.value + animTranslateX.value },
      { translateY: jitterY.value + animTranslateY.value },
      { scaleX: animScaleX.value * pulseScale.value },
      { scaleY: animScaleY.value * pulseScale.value },
      { rotate: `${animRotate.value}rad` },
    ],
    opacity: animOpacity.value,
  }));

  const shadowStyle = useAnimatedStyle(() => ({
    transform: [
      { scaleX: animScaleX.value * pulseScale.value },
      { scaleY: animScaleY.value * pulseScale.value },
    ],
    opacity: Math.max(0, (stain.dirtLevel - 0.05)) * 0.5,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Don't render if fully gone and animation complete
  if (stain.dirtLevel <= 0 && prevDirtRef.current <= 0) return null;

  const size = stain.radius * 2;
  const glowColor = STAIN_COLORS[stain.type][0];

  // Glass shards (only below 0.7 dirtLevel)
  const showShards = stain.type === 'glass' && stain.dirtLevel < 0.7;
  const shardSpread = showShards
    ? ((0.7 - stain.dirtLevel) / 0.7) * 20
    : 0;
  const shardOpacity = showShards
    ? stain.dirtLevel / 0.7
    : 0;

  // Furniture white overlay
  const showFurnitureOverlay = stain.type === 'furniture';
  const furnitureOverlayOpacity = (1 - stain.dirtLevel) * 0.3;

  return (
    <View
      style={[
        styles.container,
        {
          left: stain.position.x - stain.radius,
          top: stain.position.y - stain.radius,
          width: size,
          height: size,
        },
      ]}
      pointerEvents="none"
    >
      {/* Shadow — stronger for visibility */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: -4,
            top: 3,
            width: size + 8,
            height: size + 8,
            borderRadius: (size + 8) / 2,
            backgroundColor: 'rgba(0,0,0,0.45)',
          },
          shadowStyle,
        ]}
      />

      {/* Ambient glow — always visible so stains pop from floor */}
      {stain.dirtLevel > 0.01 && (
        <View
          style={{
            position: 'absolute',
            left: -6,
            top: -6,
            width: size + 12,
            height: size + 12,
            borderRadius: (size + 12) / 2,
            borderWidth: 1.5,
            borderColor: glowColor,
            opacity: 0.3,
          }}
        />
      )}

      {/* Active glow ring — brighter when scrubbed */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: -6,
            top: -6,
            width: size + 12,
            height: size + 12,
            borderRadius: (size + 12) / 2,
            borderWidth: 2.5,
            borderColor: glowColor,
          },
          glowStyle,
        ]}
      />

      {/* Main stain image */}
      <Animated.View style={animStyle}>
        <View style={{
          shadowColor: glowColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 8,
          elevation: 6,
        }}>
          <Image
            source={stainImages[stain.type]}
            style={{ width: size, height: size }}
            resizeMode="contain"
          />
        </View>

        {/* Furniture white overlay */}
        {showFurnitureOverlay && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: 'white',
              opacity: furnitureOverlayOpacity,
            }}
          />
        )}
      </Animated.View>

      {/* Glass shards */}
      {showShards &&
        SHARD_ANGLES.map((angle, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: size / 2 - 4 + Math.cos(angle) * shardSpread,
              top: size / 2 - 6 + Math.sin(angle) * shardSpread,
              width: 8,
              height: 12,
              backgroundColor: '#B0E0E6',
              borderRadius: 2,
              opacity: shardOpacity,
              transform: [{ rotate: `${SHARD_ROTATIONS[i]}rad` }],
            }}
          />
        ))}

      {/* Needs-spray indicator */}
      {stain.needsSpray && !stain.sprayed && stain.dirtLevel > 0.01 && (
        <View
          style={{
            position: 'absolute',
            top: -10,
            right: -6,
            backgroundColor: 'rgba(0,212,255,0.85)',
            borderRadius: 10,
            width: 20,
            height: 20,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 11, color: '#fff' }}>S</Text>
        </View>
      )}

      {/* Toughness indicator (small bars for tough stains) */}
      {(stain.toughness ?? 1) >= 2.0 && stain.dirtLevel > 0.01 && (
        <View
          style={{
            position: 'absolute',
            bottom: -6,
            alignSelf: 'center',
            left: size / 2 - 10,
            flexDirection: 'row',
            gap: 2,
          }}
        >
          {Array.from({ length: Math.min(3, Math.round((stain.toughness ?? 1) - 0.5)) }).map((_, i) => (
            <View
              key={i}
              style={{
                width: 5,
                height: 3,
                backgroundColor: '#FF9F43',
                borderRadius: 1,
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
});
