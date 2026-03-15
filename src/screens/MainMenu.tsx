import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Fonts } from '../theme';
import AnimatedButton from '../components/ui/AnimatedButton';
import { SoundManager } from '../audio/SoundManager';
import { HapticManager } from '../utils/hapticManager';

const { width: W, height: H } = Dimensions.get('window');

function TapeStripe({ top, rotate }: { top: number; rotate: string }) {
  return (
    <View
      style={[
        styles.tapeStripe,
        { top, transform: [{ rotate }] },
      ]}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <Text key={i} style={styles.tapeStripeText}>
          CRIME SCENE{' '}
        </Text>
      ))}
    </View>
  );
}

export default function MainMenu() {
  const router = useRouter();
  const [sfxOn, setSfxOn] = useState(SoundManager.isSFXEnabled());
  const [musicOn, setMusicOn] = useState(SoundManager.isMusicEnabled());

  const logoY = useSharedValue(-60);
  const logoOpacity = useSharedValue(0);
  const btnY = useSharedValue(80);
  const btnOpacity = useSharedValue(0);
  const tagOpacity = useSharedValue(0);
  const wobble = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);

  useFocusEffect(
    useCallback(() => {
      SoundManager.playMusic('menu');
      return () => {
        SoundManager.stopMusic();
      };
    }, [])
  );

  useEffect(() => {
    logoY.value = withDelay(300, withSpring(0, { damping: 10, stiffness: 80 }));
    logoOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));

    btnY.value = withDelay(800, withSpring(0, { damping: 12, stiffness: 100 }));
    btnOpacity.value = withDelay(800, withTiming(1, { duration: 500 }));

    tagOpacity.value = withDelay(1000, withTiming(1, { duration: 600 }));

    wobble.value = withDelay(
      1500,
      withRepeat(
        withSequence(
          withTiming(2, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-2, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: logoY.value }, { rotate: `${wobble.value}deg` }],
    opacity: logoOpacity.value,
  }));

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: btnY.value }],
    opacity: btnOpacity.value,
  }));

  const tagStyle = useAnimatedStyle(() => ({
    opacity: tagOpacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LinearGradient
        colors={['#0F0E17', '#1A1A2E', '#16213E', '#0F0E17']}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.container}
      >
        <TapeStripe top={H * 0.12} rotate="-3deg" />
        <TapeStripe top={H * 0.82} rotate="2deg" />

        {/* Top bar: SFX, Music, Settings */}
        <View style={styles.soundRow}>
          <TouchableOpacity
            onPress={async () => { const on = await SoundManager.toggleSFX(); setSfxOn(on); }}
            style={[styles.soundBtn, sfxOn && styles.soundBtnOn]}
            accessible
            accessibilityRole="button"
            accessibilityLabel={sfxOn ? 'Mute sound effects' : 'Enable sound effects'}
          >
            <Ionicons name={sfxOn ? 'volume-high' : 'volume-mute'} size={20} color={sfxOn ? Colors.accent : Colors.textLight} />
            {sfxOn && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => { const on = await SoundManager.toggleMusic(); setMusicOn(on); }}
            style={[styles.soundBtn, musicOn && styles.soundBtnOn]}
            accessible
            accessibilityRole="button"
            accessibilityLabel={musicOn ? 'Mute music' : 'Enable music'}
          >
            <Ionicons name={musicOn ? 'musical-notes' : 'musical-notes-outline'} size={20} color={musicOn ? Colors.accent : Colors.textLight} />
            {musicOn && <View style={styles.activeIndicator} />}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              SoundManager.playSFX('buttonTap');
              HapticManager.light();
              router.push('/settings');
            }}
            style={styles.soundBtn}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Open settings"
          >
            <Ionicons name="settings-outline" size={20} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <Animated.View style={[styles.logoArea, logoStyle]}>
          <View style={styles.iconWrap}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
              accessible
              accessibilityLabel="Crime Scene Cleaner logo"
            />
          </View>
          <Text style={styles.titleCrime} accessible accessibilityRole="header">CRIME SCENE</Text>
          <Text style={styles.titleCleaner}>CLEANER</Text>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Ionicons name="skull-outline" size={16} color={Colors.secondary} />
            <View style={styles.dividerLine} />
          </View>
          <Animated.Text style={[styles.tagline, tagStyle]}>
            Clean it. Hide it. Done.
          </Animated.Text>
        </Animated.View>

        {/* Buttons — stacked with clear breathing room */}
        <View style={styles.btnArea}>
          {/* PLAY */}
          <Animated.View style={[styles.playWrap, btnStyle]}>
            <Animated.View style={[styles.playGlow, glowStyle]} />
            <AnimatedButton
              variant="primary"
              onPress={() => router.push('/levels')}
              style={styles.playBtn}
            >
              <View style={styles.btnInner}>
                <Ionicons name="play" size={26} color={Colors.bgDark} />
                <Text style={styles.playText}>PLAY</Text>
              </View>
            </AnimatedButton>
          </Animated.View>

        </View>

        <Text style={styles.version}>v1.0</Text>
      </LinearGradient>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: H * 0.08,
    paddingBottom: 36,
  },
  tapeStripe: {
    position: 'absolute',
    left: -40,
    right: -40,
    height: 22,
    backgroundColor: Colors.tape,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    opacity: 0.15,
  },
  tapeStripeText: {
    fontSize: 9,
    color: Colors.tapeText,
    letterSpacing: 2,
  },
  soundRow: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    gap: 8,
    paddingRight: 20,
    paddingTop: 10,
    zIndex: 10,
  },
  soundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.bgElevated,
  },
  soundBtnOn: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(0,212,255,0.15)',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  logoArea: {
    alignItems: 'center',
  },
  iconWrap: {
    marginBottom: 16,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  titleCrime: {
    color: Colors.primary,
    fontSize: 28,
    letterSpacing: 2,
    textShadowColor: 'rgba(191,255,0,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  titleCleaner: {
    color: Colors.textPrimary,
    fontSize: 32,
    letterSpacing: 5,
    marginTop: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
    marginBottom: 12,
  },
  dividerLine: {
    width: 40,
    height: 1,
    backgroundColor: Colors.textLight,
  },
  tagline: {
    color: Colors.textSecondary,
    fontSize: 15,
    letterSpacing: 1,
  },
  // ── Buttons ──
  btnArea: {
    alignItems: 'center',
    gap: 20,
    width: '100%',
    paddingHorizontal: 40,
  },
  playWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  playGlow: {
    position: 'absolute',
    width: 220,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 30,
  },
  playBtn: {
    paddingHorizontal: 54,
    paddingVertical: 18,
    backgroundColor: Colors.primary,
    borderColor: Colors.primaryDark,
  },
  btnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playText: {
    color: Colors.bgDark,
    fontSize: 22,
    letterSpacing: 4,
  },
  version: {
    color: Colors.textLight,
    fontSize: 11,
  },
});
