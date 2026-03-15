import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MainMenu from '../src/screens/MainMenu';
import { ONBOARDING_KEY } from './onboarding';

export default function IndexScreen() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      if (val !== 'true') {
        router.replace('/onboarding');
      } else {
        setChecked(true);
      }
    });
  }, []);

  if (!checked) return null;

  return <MainMenu />;
}
