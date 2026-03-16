import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import { StainData, EnvironmentType, STAIN_COLORS, ENVIRONMENTS } from '../game/types';
import { Colors, Fonts } from '../theme';

interface BeforeAfterRevealProps {
  initialStains: StainData[];
  environment: EnvironmentType;
  screenWidth: number;
  screenHeight: number;
}

const VIEW_W = 280;
const VIEW_H = 180;
const DIVIDER_W = 4;

export default function BeforeAfterReveal({
  initialStains,
  environment,
  screenWidth,
  screenHeight,
}: BeforeAfterRevealProps) {
  const dividerX = useSharedValue(VIEW_W / 2);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      const newX = Math.max(20, Math.min(VIEW_W - 20, e.x));
      dividerX.value = newX;
    })
    .minDistance(0);

  const leftClipStyle = useAnimatedStyle(() => ({
    width: dividerX.value,
  }));

  const dividerStyle = useAnimatedStyle(() => ({
    left: dividerX.value - DIVIDER_W / 2,
  }));

  const floorColor = ENVIRONMENTS[environment].floorColor;

  // Scale stain positions to miniature view
  const scaleX = VIEW_W / screenWidth;
  const scaleY = VIEW_H / screenHeight;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>BEFORE / AFTER</Text>
      <GestureDetector gesture={panGesture}>
        <View style={styles.viewContainer}>
          {/* AFTER (clean) — full background */}
          <View style={[styles.roomView, { backgroundColor: floorColor }]}>
            <Text style={styles.label}>AFTER</Text>
          </View>

          {/* BEFORE (dirty) — clipped to left of divider */}
          <Animated.View style={[styles.roomViewClipped, leftClipStyle]}>
            <View style={[styles.roomViewInner, { backgroundColor: floorColor }]}>
              {/* Render stain circles */}
              {initialStains.map((stain) => {
                const cx = stain.position.x * scaleX;
                const cy = stain.position.y * scaleY;
                const r = Math.max(4, stain.radius * scaleX * 0.6);
                const color = STAIN_COLORS[stain.type][0];
                return (
                  <View
                    key={stain.id}
                    style={{
                      position: 'absolute',
                      left: cx - r,
                      top: cy - r,
                      width: r * 2,
                      height: r * 2,
                      borderRadius: r,
                      backgroundColor: color,
                      opacity: 0.8,
                    }}
                  />
                );
              })}
              <Text style={styles.label}>BEFORE</Text>
            </View>
          </Animated.View>

          {/* Divider line */}
          <Animated.View style={[styles.divider, dividerStyle]}>
            <View style={styles.dividerHandle} />
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontFamily: Fonts.bodyBold,
    letterSpacing: 2,
    marginBottom: 6,
  },
  viewContainer: {
    width: VIEW_W,
    height: VIEW_H,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.bgElevated,
  },
  roomView: {
    width: VIEW_W,
    height: VIEW_H,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: 6,
  },
  roomViewClipped: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: VIEW_H,
    overflow: 'hidden',
  },
  roomViewInner: {
    width: VIEW_W,
    height: VIEW_H,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 6,
  },
  label: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontFamily: Fonts.bodyBold,
    letterSpacing: 1,
  },
  divider: {
    position: 'absolute',
    top: 0,
    width: DIVIDER_W,
    height: VIEW_H,
    backgroundColor: Colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dividerHandle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.textPrimary,
    borderWidth: 2,
    borderColor: Colors.bgDark,
  },
});
