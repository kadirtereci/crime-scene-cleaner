/**
 * Story Mode game route — loads scene level by ID
 */
import { useLocalSearchParams } from 'expo-router';
import SceneGameScreen from '../../../src/screens/SceneGameScreen';
import { getSceneLevel } from '../../../src/game/sceneLevels';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../../../src/theme';

export default function StoryGameRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const levelId = Number(id) || 101;
  const level = getSceneLevel(levelId);

  if (!level) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>Level {levelId} not found</Text>
      </View>
    );
  }

  return <SceneGameScreen level={level} />;
}

const styles = StyleSheet.create({
  error: {
    flex: 1,
    backgroundColor: Colors.bgDark,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
