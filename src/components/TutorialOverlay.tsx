import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TutorialStep } from '../tutorial/tutorialSteps';
import { Colors, Fonts } from '../theme';

const { width: W, height: H } = Dimensions.get('window');

const EMOJI_ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  '\u{1F446}': 'hand-left-outline',
  '\u{23F1}': 'time-outline',
  '\u{1F525}': 'flame-outline',
  '\u{1F9F0}': 'construct-outline',
};

function emojiToIcon(emoji: string): keyof typeof Ionicons.glyphMap {
  return EMOJI_ICON_MAP[emoji] ?? 'information-circle-outline';
}

interface TutorialOverlayProps {
  step: TutorialStep;
  onNext: () => void;
  onSkip: () => void;
}

export default function TutorialOverlay({
  step,
  onNext,
  onSkip,
}: TutorialOverlayProps) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const top =
    step.position === 'top'
      ? H * 0.15
      : step.position === 'center'
      ? H * 0.38
      : H * 0.62;

  return (
    <View style={styles.overlay}>
      <View style={{ top, alignItems: 'center' }}>
        <Animated.View
          style={[
            styles.pulseRing,
            { opacity: pulseAnim },
          ]}
        />
        <View style={styles.bubble}>
          <Ionicons
            name={emojiToIcon(step.emoji)}
            size={36}
            color={Colors.accent}
          />
          <Text style={styles.message}>{step.message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.nextBtn} onPress={onNext}>
              <Text style={styles.nextText}>GOT IT</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSkip}>
              <Text style={styles.skipText}>Skip all</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const BUBBLE_WIDTH = W * 0.82;
const BUBBLE_PADDING = 24;
const RING_OFFSET = 4;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 1000,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: BUBBLE_WIDTH + RING_OFFSET * 2,
    height: '100%',
    borderRadius: 20 + RING_OFFSET,
    borderWidth: 1,
    borderColor: Colors.accent,
    top: -RING_OFFSET,
    left: -RING_OFFSET,
  },
  bubble: {
    width: BUBBLE_WIDTH,
    backgroundColor: Colors.bgCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.bgElevated,
    padding: BUBBLE_PADDING,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  message: {
    fontFamily: Fonts.body,
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 10,
    marginBottom: 18,
  },
  actions: {
    alignItems: 'center',
    gap: 10,
  },
  nextBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 14,
  },
  nextText: {
    fontFamily: Fonts.heading,
    color: Colors.bgDark,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
  skipText: {
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    fontSize: 13,
  },
});
