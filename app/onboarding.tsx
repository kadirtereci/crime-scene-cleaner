import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  FlatList,
  ViewToken,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Colors, Fonts } from '../src/theme';
import AnimatedButton from '../src/components/ui/AnimatedButton';
import { Analytics } from '../src/utils/analytics';

const { width: W, height: H } = Dimensions.get('window');

export const ONBOARDING_KEY = 'csc_onboarding_done';

interface Slide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  subtitle: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'skull-outline',
    iconColor: Colors.secondary,
    title: 'Crime Scene Awaits',
    subtitle: 'Suç mahalli seni bekliyor',
    description: 'You\'re the cleaner. Swipe to scrub, mop, and eliminate every trace before time runs out.',
  },
  {
    id: '2',
    icon: 'construct',
    iconColor: Colors.accent,
    title: 'Choose Your Tools',
    subtitle: 'Araçlarını seç',
    description: 'Each stain needs the right tool. Mop for blood, brush for glass, bags for trash. Upgrade them to clean faster.',
  },
  {
    id: '3',
    icon: 'flash',
    iconColor: Colors.primary,
    title: 'Race Against Time',
    subtitle: 'Zamana karşı yarış',
    description: 'Build combos for bonus points, earn stars, and unlock new crime scenes across apartments, warehouses, and offices.',
  },
];

function Dot({ active }: { active: boolean }) {
  const scale = useSharedValue(active ? 1 : 0.7);
  const opacity = useSharedValue(active ? 1 : 0.3);

  React.useEffect(() => {
    scale.value = withSpring(active ? 1 : 0.7, { damping: 15, stiffness: 200 });
    opacity.value = withSpring(active ? 1 : 0.3);
  }, [active]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: active ? 24 : 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: Colors.primary,
          marginHorizontal: 3,
        },
        style,
      ]}
    />
  );
}

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    Analytics.track('onboarding_complete');
    router.replace('/');
  };

  const skip = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    Analytics.track('onboarding_skip');
    router.replace('/');
  };

  const next = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      finish();
    }
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={styles.slide}>
      <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.slideContent}>
        <View style={[styles.iconCircle, { borderColor: item.iconColor + '40' }]}>
          <Ionicons name={item.icon} size={56} color={item.iconColor} />
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
        <Text style={styles.slideDescription}>{item.description}</Text>
      </Animated.View>
    </View>
  );

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <GestureHandlerRootView style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        bounces={false}
      />

      <View style={styles.footer}>
        {/* Dots */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <Dot key={i} active={i === currentIndex} />
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttonsRow}>
          {!isLast && (
            <AnimatedButton variant="ghost" onPress={skip} style={styles.skipBtn}>
              <Text style={styles.skipText}>Skip</Text>
            </AnimatedButton>
          )}
          <AnimatedButton
            variant="primary"
            onPress={next}
            style={styles.nextBtn}
          >
            <View style={styles.nextInner}>
              <Text style={styles.nextText}>{isLast ? 'GET STARTED' : 'NEXT'}</Text>
              <Ionicons
                name={isLast ? 'checkmark' : 'arrow-forward'}
                size={20}
                color={Colors.bgDark}
              />
            </View>
          </AnimatedButton>
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  slide: {
    width: W,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  slideContent: {
    alignItems: 'center',
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    marginBottom: 32,
  },
  slideTitle: {
    fontFamily: Fonts.heading,
    color: Colors.textPrimary,
    fontSize: 26,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 6,
  },
  slideSubtitle: {
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 20,
  },
  slideDescription: {
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 50,
    gap: 24,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  skipBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 0,
  },
  skipText: {
    fontFamily: Fonts.bodyBold,
    color: Colors.textLight,
    fontSize: 15,
  },
  nextBtn: {
    flex: 1,
    paddingVertical: 16,
  },
  nextInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextText: {
    fontFamily: Fonts.heading,
    color: Colors.bgDark,
    fontSize: 16,
    letterSpacing: 2,
  },
});
