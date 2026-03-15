import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';
import { Analytics } from './analytics';

const REVIEW_KEY = 'csc_review_prompted';

export async function maybePromptReview(levelId: number, stars: number) {
  // Only prompt on level 5 or 10 with 3 stars
  if (![5, 10].includes(levelId) || stars < 3) return;

  try {
    const prompted = await AsyncStorage.getItem(REVIEW_KEY);
    if (prompted === 'true') return;

    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) return;

    await StoreReview.requestReview();
    await AsyncStorage.setItem(REVIEW_KEY, 'true');
    Analytics.track('review_prompted', { levelId, stars });
  } catch {}
}
