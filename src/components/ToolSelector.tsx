import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ImageSourcePropType,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { ToolType, TOOLS, ToolUpgrades } from '../game/types';
import { getTier, getTierColor } from '../game/tierSystem';
import { Colors, Fonts } from '../theme';

const toolImages: Record<ToolType, ImageSourcePropType> = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  mop: require('../../assets/tools/mop.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  scrubBrush: require('../../assets/tools/scrub-brush.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  trashBag: require('../../assets/tools/trash-bag.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  repairKit: require('../../assets/tools/repair-kit.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  spray: require('../../assets/tools/spray.png'),
};

interface ToolSelectorProps {
  available: ToolType[];
  active: ToolType;
  onSelect: (tool: ToolType) => void;
  toolUpgrades?: Record<ToolType, ToolUpgrades>;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function ToolButton({
  toolType,
  isActive,
  onPress,
  upgradeLevel,
}: {
  toolType: ToolType;
  isActive: boolean;
  onPress: () => void;
  upgradeLevel?: number;
}) {
  const tool = TOOLS[toolType];
  const tier = getTier(upgradeLevel ?? 0);
  const tierColor = getTierColor(upgradeLevel ?? 0);
  const scale = useSharedValue(isActive ? 1.1 : 1.0);

  React.useEffect(() => {
    scale.value = withSpring(isActive ? 1.1 : 1.0, {
      damping: 12,
      stiffness: 150,
    });
  }, [isActive, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const borderOpacity = tier === 0 ? 0 : tier <= 2 ? 0.3 + tier * 0.1 : tier === 3 ? 0.6 : 0.7;

  const tierShadowStyle = tier >= 3 ? {
    shadowColor: tierColor,
    shadowOffset: { width: 0, height: 0 } as const,
    shadowOpacity: tier === 3 ? 0.3 : 0.5,
    shadowRadius: tier === 3 ? 6 : 10,
    elevation: 6,
  } : {};

  return (
    <AnimatedTouchable
      style={[
        styles.toolBtn,
        isActive && styles.toolBtnActive,
        tier > 0 && !isActive && { borderColor: tierColor + Math.round(borderOpacity * 255).toString(16).padStart(2, '0') },
        tierShadowStyle,
        animatedStyle,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      accessible
      accessibilityRole="button"
      accessibilityLabel={`${tool.name} tool${isActive ? ', selected' : ''}`}
      accessibilityState={{ selected: isActive }}
    >
      <Image
        source={toolImages[toolType]}
        style={[styles.toolImg, isActive && styles.toolImgActive]}
        resizeMode="contain"
        accessible
        accessibilityLabel={`${tool.name} icon`}
      />
      <Text style={[styles.toolName, isActive && styles.toolNameActive]}>
        {tool.name}
      </Text>
      {(upgradeLevel ?? 0) > 0 && (
        <View style={styles.upgradeDots}>
          {Array.from({ length: Math.min(upgradeLevel!, 4) }, (_, i) => (
            <View key={i} style={[styles.upgradeDot, tier > 0 && { backgroundColor: tierColor }]} />
          ))}
        </View>
      )}
    </AnimatedTouchable>
  );
}

export default function ToolSelector({
  available,
  active,
  onSelect,
  toolUpgrades,
}: ToolSelectorProps) {
  if (available.length <= 1) return null;

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        {available.map((toolType) => {
          const up = toolUpgrades?.[toolType];
          const totalLevel = up ? up.power + up.reach + up.speed : 0;
          return (
            <ToolButton
              key={toolType}
              toolType={toolType}
              isActive={toolType === active}
              onPress={() => onSelect(toolType)}
              upgradeLevel={totalLevel}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
    pointerEvents: 'box-none',
  },
  bar: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(15,14,23,0.94)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  toolBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bgElevated,
    borderRadius: 12,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 52,
  },
  toolBtnActive: {
    borderColor: Colors.accent,
    backgroundColor: Colors.toolBgActive,
  },
  toolImg: {
    width: 22,
    height: 32,
    opacity: 0.85,
  },
  toolImgActive: {
    opacity: 1,
  },
  toolName: {
    color: Colors.textSecondary,
    fontSize: 8,
    fontFamily: Fonts.body,
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
  },
  toolNameActive: {
    color: Colors.accent,
    fontWeight: '800',
  },
  upgradeDots: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  upgradeDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.primary,
  },
});
