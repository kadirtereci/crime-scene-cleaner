import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { Colors, Fonts } from '../theme';
import { SoundManager } from '../audio/SoundManager';
import { useState } from 'react';

const { width: W } = Dimensions.get('window');

interface PauseMenuProps {
  levelName: string;
  onResume: () => void;
  onRestart: () => void;
  onQuit: () => void;
}

export default function PauseMenu({
  levelName,
  onResume,
  onRestart,
  onQuit,
}: PauseMenuProps) {
  const [sfxOn, setSfxOn] = useState(SoundManager.isSFXEnabled());
  const [musicOn, setMusicOn] = useState(SoundManager.isMusicEnabled());

  const Overlay = Platform.OS === 'ios' ? BlurView : View;
  const overlayProps =
    Platform.OS === 'ios'
      ? { intensity: 60, tint: 'dark' as const }
      : {};

  return (
    <Overlay
      style={[
        styles.overlay,
        Platform.OS !== 'ios' && { backgroundColor: 'rgba(0,0,0,0.85)' },
      ]}
      {...overlayProps}
    >
      <Animated.View entering={ZoomIn.duration(250)} style={styles.card}>
        <Ionicons name="pause-circle" size={48} color={Colors.primary} />
        <Text style={styles.title}>PAUSED</Text>
        <Text style={styles.levelName}>{levelName}</Text>

        {/* Sound toggles */}
        <View style={styles.soundRow}>
          <TouchableOpacity
            style={[styles.soundBtn, sfxOn && styles.soundBtnOn]}
            onPress={async () => {
              const on = await SoundManager.toggleSFX();
              setSfxOn(on);
            }}
          >
            <View style={styles.soundIconWrap}>
              <Ionicons
                name={sfxOn ? 'volume-high' : 'volume-mute'}
                size={20}
                color={sfxOn ? Colors.accent : Colors.textLight}
              />
              {sfxOn && <Ionicons name="checkmark-circle" size={12} color={Colors.success} style={styles.checkIcon} />}
            </View>
            <Text style={[styles.soundLabel, sfxOn && styles.soundLabelOn]}>SFX</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.soundBtn, musicOn && styles.soundBtnOn]}
            onPress={async () => {
              const on = await SoundManager.toggleMusic();
              setMusicOn(on);
            }}
          >
            <View style={styles.soundIconWrap}>
              <Ionicons
                name={musicOn ? 'musical-notes' : 'musical-notes-outline'}
                size={20}
                color={musicOn ? Colors.accent : Colors.textLight}
              />
              {musicOn && <Ionicons name="checkmark-circle" size={12} color={Colors.success} style={styles.checkIcon} />}
            </View>
            <Text style={[styles.soundLabel, musicOn && styles.soundLabelOn]}>Music</Text>
          </TouchableOpacity>
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.resumeBtn} onPress={onResume} accessible accessibilityRole="button" accessibilityLabel="Resume game">
            <Ionicons name="play" size={20} color={Colors.bgDark} />
            <Text style={styles.resumeText}>RESUME</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.restartBtn} onPress={onRestart} accessible accessibilityRole="button" accessibilityLabel="Restart level">
            <Ionicons name="refresh" size={18} color={Colors.textPrimary} />
            <Text style={styles.restartText}>RESTART</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quitBtn} onPress={onQuit} accessible accessibilityRole="button" accessibilityLabel="Quit to menu">
            <Text style={styles.quitText}>QUIT TO MENU</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Overlay>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 998,
  },
  card: {
    width: W * 0.8,
    backgroundColor: Colors.bgCard,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.bgElevated,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    color: Colors.textPrimary,
    fontSize: 24,
    fontFamily: Fonts.heading,
    fontWeight: '900',
    letterSpacing: 3,
    marginTop: 8,
  },
  levelName: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontFamily: Fonts.body,
    marginTop: 4,
    marginBottom: 16,
  },
  soundRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  soundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.bgElevated,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  soundBtnOn: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(0,212,255,0.2)',
  },
  soundIconWrap: {
    position: 'relative',
  },
  checkIcon: {
    position: 'absolute',
    right: -6,
    bottom: -4,
  },
  soundLabel: {
    fontSize: 12,
    fontFamily: Fonts.bodyBold,
    fontWeight: '700',
    color: Colors.textLight,
  },
  soundLabelOn: {
    color: Colors.accent,
  },
  buttons: {
    width: '100%',
    gap: 10,
  },
  resumeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
  },
  resumeText: {
    color: Colors.bgDark,
    fontSize: 17,
    fontFamily: Fonts.heading,
    fontWeight: '900',
    letterSpacing: 2,
  },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.bgElevated,
    paddingVertical: 12,
    borderRadius: 14,
  },
  restartText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontFamily: Fonts.body,
    fontWeight: '700',
  },
  quitBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  quitText: {
    color: Colors.danger,
    fontSize: 14,
    fontFamily: Fonts.bodyBold,
    fontWeight: '700',
  },
});
