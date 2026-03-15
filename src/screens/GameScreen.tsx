import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  useWindowDimensions,
  ImageBackground,
  ImageSourcePropType,
  TouchableOpacity,
  Text,
} from 'react-native';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, { useSharedValue, runOnJS } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Stain from '../components/Stain';
import Mop from '../components/Mop';
import ProgressBar from '../components/ProgressBar';
import TimerLabel from '../components/TimerLabel';
import ToolSelector from '../components/ToolSelector';
import ComboDisplay from '../components/ComboDisplay';
import ResultScreen from '../components/ResultScreen';
import PauseMenu from '../components/PauseMenu';
import TutorialOverlay from '../components/TutorialOverlay';
import SparkleEffect from '../components/effects/SparkleEffect';
import CleaningParticles from '../components/effects/CleaningParticles';
import CleanTrail from '../components/effects/CleanTrail';
import RejectFlash from '../components/effects/RejectFlash';
import ProgressPop from '../components/effects/ProgressPop';
import ComboScreenEffect from '../components/effects/ComboScreenEffect';
import ComboTierAnnouncement from '../components/effects/ComboTierAnnouncement';

import {
  StainData,
  StainType,
  GameState,
  ToolType,
  LevelResult,
  EnvironmentType,
  Position,
  PlayerProgress,
  TOOLS,
  TOOL_STAIN_MAP,
} from '../game/types';
import {
  cleanTick,
  tickStainEffects,
  calculateProgress,
  isLevelComplete,
  calculateStars,
  distance,
} from '../game/cleaningSystem';
import { ComboState, createComboState, onStainCleaned, tickCombo, getComboTier, comboCleanBoost, ComboTier } from '../game/comboSystem';
import { ScoreState, createScoreState, addStainScore, addTimeBonus } from '../game/scoreSystem';
import { ALL_LEVELS, getLevel, resolveStains } from '../game/levels';
import { loadProgress, saveResult } from '../game/progressStorage';
import { getEffectiveTool, getSpeedBonus } from '../game/upgradeSystem';
import { useTutorial } from '../tutorial/useTutorial';
import { SoundManager } from '../audio/SoundManager';
import { HapticManager } from '../utils/hapticManager';
import { Analytics } from '../utils/analytics';
import { maybePromptReview } from '../utils/reviewPrompt';
import { Colors, Fonts } from '../theme';


const floorTextures: Record<EnvironmentType, ImageSourcePropType> = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  apartment: require('../../assets/environment/apartment/floor.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  warehouse: require('../../assets/environment/warehouse/floor.png'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  office: require('../../assets/environment/office/floor.png'),
};

interface GameScreenProps {
  levelId?: number;
}

export default function GameScreen({ levelId: propLevelId }: GameScreenProps) {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width: W, height: H } = useWindowDimensions();
  const currentLevelId = propLevelId ?? (Number(params.id) || 1);
  const levelConfig = getLevel(currentLevelId) ?? ALL_LEVELS[0];

  // Resolve ratio-based stain positions to pixels for current screen size
  const resolvedStains = useMemo(
    () => resolveStains(levelConfig.stains, W, H),
    [levelConfig.stains, W, H]
  );

  // ── state ──────────────────────────────
  const [stains, setStains] = useState<StainData[]>(() =>
    resolvedStains.map((s) => ({ ...s }))
  );
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(levelConfig.timeLimit);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [mopVisible, setMopVisible] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolType>(levelConfig.tools[0]);
  const [combo, setCombo] = useState<ComboState>(createComboState);
  const [score, setScore] = useState<ScoreState>(createScoreState);
  const [result, setResult] = useState<LevelResult | null>(null);
  const [sparkles, setSparkles] = useState<{ id: number; pos: Position }[]>([]);
  const [cleaningParticles, setCleaningParticles] = useState<
    { id: number; pos: Position; stainType: StainType }[]
  >([]);
  const [trailPoints, setTrailPoints] = useState<{ x: number; y: number; timestamp: number }[]>([]);
  const [scrubbedStainIds, setScrubbedStainIds] = useState<Set<string>>(new Set());
  const [showBriefing, setShowBriefing] = useState(!!levelConfig.modifiers?.briefing);
  const [playerProgress, setPlayerProgress] = useState<PlayerProgress | null>(null);
  const [tierAnnouncement, setTierAnnouncement] = useState<{ id: number; tier: ComboTier } | null>(null);
  const tierAnnouncementId = useRef(0);
  const lastTierRef = useRef<ComboTier>('none');
  const [rejectFlashes, setRejectFlashes] = useState<
    { id: number; pos: Position; reason: 'wrongTool' | 'needsSpray' }[]
  >([]);
  const [progressPops, setProgressPops] = useState<
    { id: number; pos: Position; text: string }[]
  >([]);
  let sparkleId = useRef(0);
  const particleId = useRef(0);
  const cleanTickCount = useRef(0);
  const rejectFlashId = useRef(0);
  const progressPopId = useRef(0);
  const lastRejectRef = useRef<Record<string, number>>({});
  const milestonesHitRef = useRef<Record<string, Set<number>>>({});
  const timeLeftRef = useRef(timeLeft);
  timeLeftRef.current = timeLeft;

  const stainRef = useRef(stains);
  stainRef.current = stains;
  const comboRef = useRef(combo);
  comboRef.current = combo;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Velocity tracking
  const prevPosRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const speedRef = useRef(0);

  const mopX = useSharedValue(W / 2);
  const mopY = useSharedValue(H / 2);
  const mopAngle = useSharedValue(0);

  // ── tutorial ───────────────────────────
  const tutorial = useTutorial(currentLevelId, levelConfig.tools.length);

  // ── load player progress for upgrades ──
  useEffect(() => {
    loadProgress().then(setPlayerProgress);
  }, []);

  // ── derived upgrade values ────────────
  const upgrades = playerProgress?.toolUpgrades[activeTool];
  const effectiveTool = getEffectiveTool(activeTool, upgrades);
  const speedBonus = getSpeedBonus(upgrades);
  const comboTier = getComboTier(combo.count);

  // ── analytics & music for environment ──
  useEffect(() => {
    Analytics.track('level_start', { levelId: currentLevelId, environment: levelConfig.environment });
    SoundManager.playMusic(levelConfig.environment as 'apartment' | 'warehouse' | 'office');
    return () => {
      SoundManager.stopMusic();
    };
  }, [levelConfig.environment]);

  // ── timer (with rush mode) ─────────────
  useEffect(() => {
    if (gameState !== 'playing' || tutorial.isActive || showBriefing) return;

    const rushSec = levelConfig.modifiers?.rushLastSeconds ?? 0;
    const interval = rushSec > 0 && timeLeftRef.current <= rushSec ? 500 : 1000;

    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          handleGameEnd(false, 0);
          return 0;
        }
        return t - 1;
      });
    }, interval);

    return () => clearInterval(id);
  }, [gameState, tutorial.isActive, showBriefing, timeLeft <= (levelConfig.modifiers?.rushLastSeconds ?? 0)]);

  // ── stain regrow & spread tick ────────
  useEffect(() => {
    if (gameState !== 'playing' || tutorial.isActive || showBriefing) return;
    const mods = levelConfig.modifiers;
    if (!mods?.globalRegrowRate && !mods?.globalSpreadRate) {
      // check if any individual stains have effects
      const hasEffects = stainRef.current.some(s => s.regrowRate || s.spreadRate);
      if (!hasEffects) return;
    }

    const id = setInterval(() => {
      const updated = tickStainEffects(stainRef.current, mods);
      setStains(updated);
      stainRef.current = updated;
      setProgress(calculateProgress(updated));
    }, 1000);

    return () => clearInterval(id);
  }, [gameState, tutorial.isActive, showBriefing, levelConfig.modifiers]);

  // ── combo decay ────────────────────────
  useEffect(() => {
    if (gameState !== 'playing') return;

    const id = setInterval(() => {
      setCombo((c) => {
        const next = tickCombo(c, Date.now());
        if (next.count === 0) lastTierRef.current = 'none';
        return next;
      });
    }, 500);

    return () => clearInterval(id);
  }, [gameState]);

  // ── pause / resume ─────────────────────
  const togglePause = useCallback(() => {
    setGameState((s) => {
      if (s === 'playing') {
        stopCleaning();
        SoundManager.pauseMusic();
        return 'paused';
      }
      if (s === 'paused') {
        SoundManager.resumeMusic();
        return 'playing';
      }
      return s;
    });
  }, []);

  // ── game end ───────────────────────────
  const handleGameEnd = useCallback(
    async (won: boolean, timeRemaining: number) => {
      if (gameStateRef.current !== 'playing') return;

      const finalScore = won
        ? addTimeBonus(scoreRef.current, timeRemaining)
        : scoreRef.current;

      setScore(finalScore);

      const stars = won
        ? calculateStars(timeRemaining, levelConfig.starThresholds)
        : 0;

      const levelResult: LevelResult = {
        levelId: currentLevelId,
        stars,
        score: finalScore.score,
        timeUsed: levelConfig.timeLimit - timeRemaining,
        maxCombo: comboRef.current.maxCombo,
        completed: won,
      };

      setResult(levelResult);
      setGameState(won ? 'won' : 'lost');

      try {
        await saveResult(levelResult);
        if (won) {
          maybePromptReview(currentLevelId, stars);
        }
      } catch {}

      Analytics.track(won ? 'level_complete' : 'level_fail', {
        levelId: currentLevelId,
        stars,
        score: finalScore.score,
        timeUsed: levelConfig.timeLimit - timeRemaining,
      });

      // Stop gameplay audio, play result SFX
      SoundManager.stopAllSFX();
      if (won) {
        HapticManager.success();
        SoundManager.playSFX('levelComplete');
      } else {
        SoundManager.playSFX('levelFail');
      }
    },
    [currentLevelId, levelConfig]
  );

  // ── sparkle helper ─────────────────────
  const addSparkle = useCallback((pos: Position) => {
    const id = sparkleId.current++;
    setSparkles((prev) => [...prev, { id, pos }]);
  }, []);

  const removeSparkle = useCallback((id: number) => {
    setSparkles((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const removeParticle = useCallback((id: number) => {
    setCleaningParticles((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const removeRejectFlash = useCallback((id: number) => {
    setRejectFlashes((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const removeProgressPop = useCallback((id: number) => {
    setProgressPops((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // ── cleaning loop ──────────────────────
  const cleaningInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCleaning = useCallback(
    (x: number, y: number) => {
      if (gameStateRef.current !== 'playing' || tutorial.isActive) return;
      setMopVisible(true);
      mopX.value = x;
      mopY.value = y;

      cleaningInterval.current = setInterval(() => {
        if (gameStateRef.current !== 'playing') {
          stopCleaning();
          return;
        }

        // Decay speed when not moving (no moveCleaning calls)
        const timeSinceMove = prevPosRef.current ? Date.now() - prevPosRef.current.time : 999;
        if (timeSinceMove > 50) {
          speedRef.current *= 0.7; // smooth decay toward 0
        }

        const prevStains = stainRef.current;
        const toolPos = { x: mopX.value, y: mopY.value };
        const { stains: updated, cleaned } = cleanTick(
          prevStains,
          toolPos,
          activeTool,
          speedRef.current,
          { toolOverride: effectiveTool, speedBonus, comboBoost: comboCleanBoost(comboRef.current.count) }
        );
        setStains(updated);
        stainRef.current = updated;

        // Track which stains are in range (for scrub jitter)
        const toolReach = effectiveTool.reach;
        const allowedStains = TOOL_STAIN_MAP[activeTool];
        const inRange = new Set<string>();
        for (const s of updated) {
          if (s.dirtLevel > 0.01 && allowedStains.includes(s.type) &&
              distance(toolPos, s.position) < s.radius + toolReach) {
            // Only count as "in range" if not blocked by needsSpray
            if (!(s.needsSpray && !s.sprayed && activeTool !== 'spray')) {
              inRange.add(s.id);
            }
          }
        }
        setScrubbedStainIds(inRange);

        // Play scrub SFX while actively cleaning (type-specific)
        if (inRange.size > 0) {
          // Find dominant stain type from in-range stains
          let dominantType: StainType | null = null;
          let maxDirt = 0;
          for (const s of updated) {
            if (inRange.has(s.id) && s.dirtLevel > maxDirt) {
              maxDirt = s.dirtLevel;
              dominantType = s.type;
            }
          }
          if (dominantType) {
            SoundManager.playScrubSFX(dominantType);
          }
        }

        // Rejection detection: wrong tool or needs spray
        const now2 = Date.now();
        for (const s of updated) {
          if (s.dirtLevel <= 0.01) continue;
          if (distance(toolPos, s.position) >= s.radius + toolReach) continue;

          let rejectReason: 'wrongTool' | 'needsSpray' | null = null;
          if (!allowedStains.includes(s.type)) {
            rejectReason = 'wrongTool';
          } else if (s.needsSpray && !s.sprayed && activeTool !== 'spray') {
            rejectReason = 'needsSpray';
          }

          if (rejectReason) {
            const lastReject = lastRejectRef.current[s.id] ?? 0;
            if (now2 - lastReject > 800) {
              lastRejectRef.current[s.id] = now2;
              const rid = rejectFlashId.current++;
              setRejectFlashes((prev) =>
                prev.length >= 4 ? prev : [...prev, { id: rid, pos: s.position, reason: rejectReason! }]
              );
              SoundManager.playSFX('reject');
            }
          }
        }

        // Milestone pops: detect dirt level crossing 0.75, 0.50, 0.25
        const MILESTONES = [0.75, 0.50, 0.25];
        for (let i = 0; i < updated.length; i++) {
          const prev = prevStains[i];
          const curr = updated[i];
          if (prev.dirtLevel <= curr.dirtLevel) continue;

          if (!milestonesHitRef.current[curr.id]) {
            milestonesHitRef.current[curr.id] = new Set();
          }
          const hitSet = milestonesHitRef.current[curr.id];

          for (const threshold of MILESTONES) {
            if (prev.dirtLevel > threshold && curr.dirtLevel <= threshold && !hitSet.has(threshold)) {
              hitSet.add(threshold);
              const pid = progressPopId.current++;
              setProgressPops((pp) =>
                pp.length >= 4 ? pp : [...pp, { id: pid, pos: curr.position, text: `+${Math.round((1 - threshold) * 100)}%` }]
              );
              HapticManager.light();
            }
          }
        }

        // Emit cleaning particles every 3rd tick for scrubbed stains
        cleanTickCount.current++;
        if (cleanTickCount.current % 3 === 0 && inRange.size > 0) {
          setCleaningParticles((prev) => {
            if (prev.length >= 6) return prev; // cap active bursts
            const newParticles: { id: number; pos: Position; stainType: StainType }[] = [];
            for (const s of updated) {
              if (inRange.has(s.id)) {
                newParticles.push({
                  id: particleId.current++,
                  pos: {
                    x: s.position.x + (Math.random() - 0.5) * 10,
                    y: s.position.y + (Math.random() - 0.5) * 10,
                  },
                  stainType: s.type,
                });
              }
            }
            return [...prev, ...newParticles].slice(0, 6);
          });
        }

        // Sparkle + combo + score on clean
        if (cleaned > 0) {
          const now = Date.now();
          let newCombo = comboRef.current;
          let newScore = scoreRef.current;

          for (let i = 0; i < updated.length; i++) {
            if (prevStains[i].dirtLevel > 0.01 && updated[i].dirtLevel <= 0.01) {
              addSparkle(updated[i].position);
            }
          }

          for (let i = 0; i < cleaned; i++) {
            newCombo = onStainCleaned(newCombo, now);
            newScore = addStainScore(newScore, newCombo.multiplier);
          }
          setCombo(newCombo);
          comboRef.current = newCombo;
          setScore(newScore);
          scoreRef.current = newScore;

          // Haptics scale with combo tier
          const currentTier = getComboTier(newCombo.count);
          if (currentTier === 'blazing' || currentTier === 'inferno') {
            HapticManager.heavy();
          } else if (currentTier === 'hot') {
            HapticManager.medium();
          } else {
            HapticManager.light();
          }

          // Tier transition announcement
          if (currentTier !== lastTierRef.current && currentTier !== 'none') {
            lastTierRef.current = currentTier;
            const tid = tierAnnouncementId.current++;
            setTierAnnouncement({ id: tid, tier: currentTier });
            SoundManager.playSFX('comboUp');
            HapticManager.warning();
          }

          // Play type-specific clean sound for completed stains
          for (let i = 0; i < updated.length; i++) {
            if (prevStains[i].dirtLevel > 0.01 && updated[i].dirtLevel <= 0.01) {
              SoundManager.playCleanSFX(updated[i].type);
              break; // one clean sound per tick is enough
            }
          }
        }

        const prog = calculateProgress(updated);
        setProgress(prog);

        if (isLevelComplete(updated)) {
          stopCleaning();
          setTimeLeft((t) => {
            handleGameEnd(true, t);
            return t;
          });
        }
      }, 33);
    },
    [activeTool, handleGameEnd, tutorial.isActive]
  );

  const moveCleaning = useCallback((x: number, y: number) => {
    // Calculate velocity (time-normalized px/frame at 60fps)
    const now = Date.now();
    if (prevPosRef.current) {
      const dx = x - prevPosRef.current.x;
      const dy = y - prevPosRef.current.y;
      const dt = Math.max(1, now - prevPosRef.current.time);
      // Normalize to px per 16ms (≈60fps frame)
      const rawSpeed = (Math.sqrt(dx * dx + dy * dy) / dt) * 16;
      // Smooth with previous value to avoid spikes
      speedRef.current = speedRef.current * 0.3 + rawSpeed * 0.7;
      if (speedRef.current > 2) {
        const MAX_TILT = 0.3;
        const tiltTarget = Math.max(-MAX_TILT, Math.min(MAX_TILT, dx * 0.03));
        mopAngle.value = tiltTarget;
      }
    }
    prevPosRef.current = { x, y, time: now };

    mopX.value = x;
    mopY.value = y;

    // Add trail point (lightweight — max 8 points, 200ms lifetime)
    setTrailPoints((prev) => {
      const now = Date.now();
      const filtered = prev.filter((p) => now - p.timestamp < 400);
      const next = [...filtered, { x, y, timestamp: now }];
      return next.length > 20 ? next.slice(next.length - 20) : next;
    });
  }, []);

  const stopCleaning = useCallback(() => {
    setMopVisible(false);
    prevPosRef.current = null;
    speedRef.current = 0;
    setTrailPoints([]);
    setScrubbedStainIds(new Set());
    if (cleaningInterval.current) {
      clearInterval(cleaningInterval.current);
      cleaningInterval.current = null;
    }
  }, []);

  // ── gesture ────────────────────────────
  const panGesture = Gesture.Pan()
    .onStart((e) => {
      runOnJS(startCleaning)(e.absoluteX, e.absoluteY);
    })
    .onUpdate((e) => {
      runOnJS(moveCleaning)(e.absoluteX, e.absoluteY);
    })
    .onEnd(() => {
      runOnJS(stopCleaning)();
    })
    .minDistance(0);

  // ── actions ────────────────────────────
  const restart = useCallback(() => {
    setStains(resolvedStains.map((s) => ({ ...s })));
    setProgress(0);
    setTimeLeft(levelConfig.timeLimit);
    setGameState('playing');
    setMopVisible(false);
    setCombo(createComboState());
    setScore(createScoreState());
    // Resume music — it may be paused (from pause menu) or stopped (from game end)
    SoundManager.playMusic(levelConfig.environment as 'apartment' | 'warehouse' | 'office');
    setResult(null);
    setSparkles([]);
    setCleaningParticles([]);
    setTrailPoints([]);
    setScrubbedStainIds(new Set());
    setRejectFlashes([]);
    setProgressPops([]);
    lastRejectRef.current = {};
    milestonesHitRef.current = {};
    lastTierRef.current = 'none';
    setTierAnnouncement(null);
    setActiveTool(levelConfig.tools[0]);
    setShowBriefing(!!levelConfig.modifiers?.briefing);
  }, [levelConfig, resolvedStains]);

  const goNext = useCallback(() => {
    // Go back to levels, then push next game — keeps stack clean
    if (router.canGoBack()) {
      router.back();
    }
    setTimeout(() => {
      router.push(`/game/${currentLevelId + 1}`);
    }, 50);
  }, [currentLevelId, router]);

  const goMenu = useCallback(() => {
    // Pop back to levels screen
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/levels');
    }
  }, [router]);

  const hasNextLevel = currentLevelId < ALL_LEVELS.length;

  // ── render ─────────────────────────────
  return (
    <GestureHandlerRootView style={styles.root}>
      {/* HUD */}
      <View style={styles.hud} accessible accessibilityRole="toolbar" accessibilityLabel="Game controls">
        <View style={styles.hudRow}>
          <TimerLabel seconds={timeLeft} />
          <View style={styles.hudRight}>
            <View style={styles.scoreChip} accessible accessibilityRole="text" accessibilityLabel={`Score: ${score.score}`} accessibilityLiveRegion="polite">
              <Ionicons name="flash" size={12} color={Colors.tertiary} />
              <Text style={styles.scoreText}>{score.score}</Text>
            </View>
            <TouchableOpacity style={styles.pauseBtn} onPress={togglePause} accessible accessibilityRole="button" accessibilityLabel="Pause game">
              <Ionicons name="pause" size={16} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
        <ProgressBar progress={progress} />
      </View>

      {/* Combo — floats below HUD, centered, doesn't fight for row space */}
      <View style={styles.comboFloater} pointerEvents="none">
        <ComboDisplay combo={combo.count} multiplier={combo.multiplier} comboTier={comboTier} />
      </View>

      {/* Game area */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.gameArea}>
          <ImageBackground
            source={floorTextures[levelConfig.environment]}
            style={styles.floor}
            resizeMode="repeat"
          >
            {/* Dark overlay to mute busy floor textures (warehouse especially) */}
            {levelConfig.environment === 'warehouse' && (
              <View style={styles.floorOverlay} />
            )}

            {stains.map((s) => (
              <Stain key={s.id} stain={s} isBeingScrubbed={scrubbedStainIds.has(s.id)} />
            ))}

            {/* Clean trail */}
            {mopVisible && <CleanTrail points={trailPoints} tool={activeTool} />}

            {/* Cleaning particles */}
            {cleaningParticles.map((cp) => (
              <CleaningParticles
                key={cp.id}
                position={cp.pos}
                stainType={cp.stainType}
                onDone={() => removeParticle(cp.id)}
              />
            ))}

            {/* Sparkle effects */}
            {sparkles.map((sp) => (
              <SparkleEffect
                key={sp.id}
                position={sp.pos}
                onDone={() => removeSparkle(sp.id)}
              />
            ))}

            {/* Reject flashes */}
            {rejectFlashes.map((rf) => (
              <RejectFlash
                key={rf.id}
                position={rf.pos}
                reason={rf.reason}
                onDone={() => removeRejectFlash(rf.id)}
              />
            ))}

            {/* Progress milestone pops */}
            {progressPops.map((pp) => (
              <ProgressPop
                key={pp.id}
                position={pp.pos}
                text={pp.text}
                onDone={() => removeProgressPop(pp.id)}
              />
            ))}

            <Mop x={mopX} y={mopY} angle={mopAngle} visible={mopVisible} tool={activeTool} isCleaning={scrubbedStainIds.size > 0} comboTier={comboTier} reachOverride={effectiveTool.reach} totalLevel={upgrades ? upgrades.power + upgrades.reach + upgrades.speed : 0} />

            {/* Darkness overlay */}
            {(levelConfig.modifiers?.darkness ?? 0) > 0 && (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: `rgba(0,0,0,${levelConfig.modifiers!.darkness})` },
                ]}
                pointerEvents="none"
              />
            )}

            {/* Combo screen edge effect */}
            <ComboScreenEffect comboTier={comboTier} />
          </ImageBackground>
        </Animated.View>
      </GestureDetector>

      {/* Tool selector */}
      <ToolSelector
        available={levelConfig.tools}
        active={activeTool}
        onSelect={(t) => {
          setActiveTool(t);
          SoundManager.playSFX('toolSwitch');
        }}
        toolUpgrades={playerProgress?.toolUpgrades}
      />

      {/* Tutorial */}
      {tutorial.isActive && tutorial.currentStep && (
        <TutorialOverlay
          step={tutorial.currentStep}
          onNext={tutorial.next}
          onSkip={tutorial.skip}
        />
      )}

      {/* Briefing overlay */}
      {showBriefing && (
        <View style={styles.briefingOverlay}>
          <View style={styles.briefingCard}>
            <Text style={styles.briefingTitle}>{levelConfig.name}</Text>
            <Text style={styles.briefingText}>{levelConfig.modifiers?.briefing}</Text>
            <TouchableOpacity
              style={styles.briefingBtn}
              onPress={() => setShowBriefing(false)}
            >
              <Text style={styles.briefingBtnText}>START</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Rush warning */}
      {(levelConfig.modifiers?.rushLastSeconds ?? 0) > 0 &&
        timeLeft <= levelConfig.modifiers!.rushLastSeconds! &&
        timeLeft > 0 &&
        gameState === 'playing' && (
          <View style={styles.rushBanner} pointerEvents="none">
            <Text style={styles.rushText}>HURRY!</Text>
          </View>
        )}

      {/* Combo tier announcement */}
      {tierAnnouncement && (
        <ComboTierAnnouncement
          key={tierAnnouncement.id}
          tier={tierAnnouncement.tier}
          onDone={() => setTierAnnouncement(null)}
        />
      )}

      {/* Pause */}
      {gameState === 'paused' && (
        <PauseMenu
          levelName={levelConfig.name}
          onResume={togglePause}
          onRestart={restart}
          onQuit={goMenu}
        />
      )}

      {/* Result */}
      {(gameState === 'won' || gameState === 'lost') && result && (
        <ResultScreen
          result={result}
          levelName={levelConfig.name}
          hasNextLevel={hasNextLevel}
          onRestart={restart}
          onNext={goNext}
          onMenu={goMenu}
          onUpgrades={() => router.push('/upgrades')}
        />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgDark,
  },
  hud: {
    paddingTop: 50,
    backgroundColor: Colors.hudBg,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  hudRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hudRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 12,
  },
  comboFloater: {
    position: 'absolute',
    top: 96,
    alignSelf: 'center',
    zIndex: 15,
  },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.bgElevated,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  scoreText: {
    fontFamily: Fonts.bodyBold,
    color: Colors.tertiary,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
  },
  pauseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.bgElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gameArea: {
    flex: 1,
  },
  floor: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  floorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  briefingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 50,
  },
  briefingCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 16,
    padding: 28,
    width: '80%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  briefingTitle: {
    fontFamily: Fonts.bodyBold,
    fontSize: 22,
    color: Colors.primary,
    marginBottom: 12,
  },
  briefingText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  briefingBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 8,
  },
  briefingBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.bgDark,
  },
  rushBanner: {
    position: 'absolute',
    top: '18%',
    alignSelf: 'center',
    backgroundColor: 'rgba(255,56,56,0.85)',
    paddingHorizontal: 24,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 20,
  },
  rushText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 18,
    color: '#fff',
    letterSpacing: 3,
  },
});
