import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useCallback } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Asset } from 'expo-asset';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Bungee_400Regular } from '@expo-google-fonts/bungee';
import { BungeeShade_400Regular } from '@expo-google-fonts/bungee-shade';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
  Nunito_900Black,
} from '@expo-google-fonts/nunito';
import 'react-native-reanimated';
import { SoundManager } from '../src/audio/SoundManager';
import { HapticManager } from '../src/utils/hapticManager';
import { Analytics } from '../src/utils/analytics';
import { Colors } from '../src/theme';

// Keep splash screen visible while loading
SplashScreen.preventAutoHideAsync();

// All images to preload
const imageAssets = [
  require('../assets/environment/apartment/floor.png'),
  require('../assets/environment/apartment/wall.png'),
  require('../assets/environment/warehouse/floor.png'),
  require('../assets/environment/warehouse/wall.png'),
  require('../assets/environment/office/floor.png'),
  require('../assets/environment/office/wall.png'),
  require('../assets/stains/blood-stain.png'),
  require('../assets/stains/broken-glass.png'),
  require('../assets/stains/trash.png'),
  require('../assets/stains/evidence.png'),
  require('../assets/stains/broken-furniture.png'),
  require('../assets/tools/mop.png'),
  require('../assets/tools/scrub-brush.png'),
  require('../assets/tools/trash-bag.png'),
  require('../assets/tools/repair-kit.png'),
  require('../assets/tools/spray.png'),
  require('../assets/images/logo.png'),
];

export default function RootLayout() {
  const [assetsReady, setAssetsReady] = useState(false);
  const [loadError, setLoadError] = useState(false);

  const [fontsLoaded] = useFonts({
    BungeeShade: BungeeShade_400Regular,
    Bungee: Bungee_400Regular,
    Nunito: Nunito_400Regular,
    'Nunito-SemiBold': Nunito_600SemiBold,
    'Nunito-Bold': Nunito_700Bold,
    'Nunito-ExtraBold': Nunito_800ExtraBold,
    'Nunito-Black': Nunito_900Black,
  });

  const loadAssets = useCallback(async () => {
    try {
      await Promise.all([
        Asset.loadAsync(imageAssets),
        SoundManager.init(),
        HapticManager.init(),
      ]);
      Analytics.track('app_open');
      setLoadError(false);
    } catch (e) {
      console.warn('Asset preload error:', e);
      setLoadError(true);
    } finally {
      setAssetsReady(true);
    }
  }, []);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const retry = useCallback(() => {
    setLoadError(false);
    setAssetsReady(false);
    loadAssets();
  }, [loadAssets]);

  const ready = assetsReady && fontsLoaded;

  const onLayoutReady = useCallback(async () => {
    if (ready) {
      await SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return (
      <View style={styles.loading}>
        {loadError ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Failed to load assets</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={retry}
              accessible
              accessibilityRole="button"
              accessibilityLabel="Retry loading"
            >
              <Text style={styles.retryText}>RETRY</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ActivityIndicator size="large" color={Colors.primary} />
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.bgDark }} onLayout={onLayoutReady}>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" options={{ gestureEnabled: false }} />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false, animation: 'fade' }} />
        <Stack.Screen name="levels" options={{ gestureEnabled: true }} />
        <Stack.Screen name="upgrades" options={{ gestureEnabled: true }} />
        <Stack.Screen name="settings" options={{ gestureEnabled: true, animation: 'slide_from_bottom' }} />
        <Stack.Screen name="game/[id]" options={{ gestureEnabled: false }} />
      </Stack>
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgDark,
  },
  errorContainer: {
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    color: '#A7A9BE',
    fontSize: 16,
  },
  retryBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: Colors.bgDark,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
