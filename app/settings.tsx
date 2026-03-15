import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import * as WebBrowser from 'expo-web-browser';
import { Colors, Fonts } from '../src/theme';
import { SoundManager } from '../src/audio/SoundManager';
import { HapticManager } from '../src/utils/hapticManager';
import { resetProgress } from '../src/game/progressStorage';

const PRIVACY_POLICY_URL = 'https://crimescenecleaner.app/privacy';

function SettingRow({
  icon,
  iconColor,
  label,
  value,
  onToggle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: boolean;
  onToggle: (val: boolean) => void;
}) {
  return (
    <View style={styles.settingRow} accessible accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }}>
      <View style={[styles.settingIconWrap, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: Colors.bgElevated, true: iconColor + '50' }}
        thumbColor={value ? iconColor : Colors.textLight}
      />
    </View>
  );
}

function LinkRow({
  icon,
  iconColor,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.settingRow}
      onPress={onPress}
      activeOpacity={0.7}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[styles.settingIconWrap, { backgroundColor: iconColor + '15' }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [sfxOn, setSfxOn] = useState(SoundManager.isSFXEnabled());
  const [musicOn, setMusicOn] = useState(SoundManager.isMusicEnabled());
  const [lightsOn, setLightsOn] = useState(SoundManager.isPoliceLightsEnabled());
  const [hapticOn, setHapticOn] = useState(HapticManager.isEnabled());

  useFocusEffect(
    useCallback(() => {
      setSfxOn(SoundManager.isSFXEnabled());
      setMusicOn(SoundManager.isMusicEnabled());
      setLightsOn(SoundManager.isPoliceLightsEnabled());
      setHapticOn(HapticManager.isEnabled());
    }, [])
  );

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Audio */}
        <Text style={styles.sectionTitle}>AUDIO</Text>
        <View style={styles.card}>
          <SettingRow
            icon="volume-high"
            iconColor={Colors.accent}
            label="Sound Effects"
            value={sfxOn}
            onToggle={async (val) => {
              await SoundManager.setSFXEnabled(val);
              setSfxOn(val);
            }}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="musical-notes"
            iconColor={Colors.accent}
            label="Music"
            value={musicOn}
            onToggle={async (val) => {
              await SoundManager.setMusicEnabled(val);
              setMusicOn(val);
            }}
          />
        </View>

        {/* Gameplay */}
        <Text style={styles.sectionTitle}>GAMEPLAY</Text>
        <View style={styles.card}>
          <SettingRow
            icon="phone-portrait"
            iconColor={Colors.primary}
            label="Haptic Feedback"
            value={hapticOn}
            onToggle={async (val) => {
              await HapticManager.setEnabled(val);
              setHapticOn(val);
            }}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="flash"
            iconColor={Colors.secondary}
            label="Police Lights"
            value={lightsOn}
            onToggle={async (val) => {
              await SoundManager.setPoliceLightsEnabled(val);
              setLightsOn(val);
            }}
          />
        </View>

        {/* About */}
        <Text style={styles.sectionTitle}>ABOUT</Text>
        <View style={styles.card}>
          <LinkRow
            icon="shield-checkmark"
            iconColor={Colors.accent}
            label="Privacy Policy"
            onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}
          />
          <View style={styles.divider} />
          <LinkRow
            icon="document-text"
            iconColor={Colors.tertiary}
            label="Terms of Service"
            onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)}
          />
        </View>

        {/* Danger Zone */}
        <Text style={styles.sectionTitle}>DATA</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={async () => {
              await resetProgress();
              HapticManager.warning();
            }}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Reset all progress"
          >
            <View style={[styles.settingIconWrap, { backgroundColor: Colors.danger + '15' }]}>
              <Ionicons name="trash" size={18} color={Colors.danger} />
            </View>
            <Text style={[styles.settingLabel, { color: Colors.danger }]}>Reset Progress</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* Version */}
        <Text style={styles.versionText}>Crime Scene Cleaner v{appVersion}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: Colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.heading,
    color: Colors.textPrimary,
    fontSize: 20,
    letterSpacing: 3,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: Fonts.heading,
    color: Colors.textLight,
    fontSize: 11,
    letterSpacing: 2,
    marginTop: 24,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.bgElevated,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 12,
  },
  settingIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingLabel: {
    flex: 1,
    fontFamily: Fonts.bodyBold,
    color: Colors.textPrimary,
    fontSize: 15,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.bgElevated,
    marginLeft: 60,
  },
  versionText: {
    fontFamily: Fonts.body,
    color: Colors.textLight,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 32,
  },
});
