import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const HAPTIC_KEY = 'csc_haptic_enabled';
let hapticEnabled = true;

export const HapticManager = {
  async init() {
    try {
      const raw = await AsyncStorage.getItem(HAPTIC_KEY);
      if (raw !== null) hapticEnabled = JSON.parse(raw);
    } catch {}
  },

  isEnabled: () => hapticEnabled,

  async setEnabled(enabled: boolean) {
    hapticEnabled = enabled;
    try {
      await AsyncStorage.setItem(HAPTIC_KEY, JSON.stringify(enabled));
    } catch {}
  },

  async toggle() {
    await this.setEnabled(!hapticEnabled);
    return hapticEnabled;
  },

  light() {
    if (!hapticEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },

  medium() {
    if (!hapticEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },

  heavy() {
    if (!hapticEnabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },

  success() {
    if (!hapticEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },

  warning() {
    if (!hapticEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },

  error() {
    if (!hapticEnabled) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },

  selection() {
    if (!hapticEnabled) return;
    Haptics.selectionAsync();
  },
};
