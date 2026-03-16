/**
 * SceneGameScreen — Story Mode gameplay with illustrated room, mess sprites, and clues
 * Reuses all classic mode UI components: effects, HUD, pause, result, combo
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  useWindowDimensions,
  ImageBackground,
  TouchableOpacity,
  Text,
} from 'react-native';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, { useSharedValue, runOnJS } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

// ── Shared classic-mode components ───────
import Mop from '../components/Mop';
import ProgressBar from '../components/ProgressBar';
import TimerLabel from '../components/TimerLabel';
import ToolSelector from '../components/ToolSelector';
import ComboDisplay from '../components/ComboDisplay';
import PauseMenu from '../components/PauseMenu';
import ResultScreen from '../components/ResultScreen';
import SparkleEffect from '../components/effects/SparkleEffect';
import CleaningParticles from '../components/effects/CleaningParticles';
import CleanTrail from '../components/effects/CleanTrail';
import RejectFlash from '../components/effects/RejectFlash';
import ComboScreenEffect from '../components/effects/ComboScreenEffect';
import ComboTierAnnouncement from '../components/effects/ComboTierAnnouncement';

// ── Story-specific components ────────────
import MessObject from '../components/MessObject';
import RevealedClue from '../components/RevealedClue';
import ClueCollectedToast from '../components/ClueCollectedToast';
import IncidentReport from '../components/IncidentReport';

// ── Systems ──────────────────────────────
import { GameState, ToolType, LevelResult, Position, StainType, TOOL_STAIN_MAP } from '../game/types';
import { SceneLevelConfig, MessObjectData, ClueData } from '../game/storyTypes';
import {
  cleanMessTick,
  calculateSceneProgress,
  isSceneLevelComplete,
  getMessInRange,
  rectDistance,
} from '../game/sceneCleaningSystem';
import { calculateStars } from '../game/cleaningSystem';
import { ClueState, createClueState, revealClue, collectClue, getCollectedClueIds } from '../game/clueSystem';
import { ComboState, createComboState, onStainCleaned, tickCombo, getComboTier, ComboTier } from '../game/comboSystem';
import { ScoreState, createScoreState, addStainScore, addTimeBonus } from '../game/scoreSystem';
import {
  saveSceneLevelResult,
  getEpisode,
  buildIncidentReport,
  loadStoryProgress,
} from '../game/episodeSystem';
import { SoundManager } from '../audio/SoundManager';
import { HapticManager } from '../utils/hapticManager';
import { Colors, Fonts } from '../theme';

interface SceneGameScreenProps {
  level: SceneLevelConfig;
}

export default function SceneGameScreen({ level }: SceneGameScreenProps) {
  const router = useRouter();
  const { width: W, height: H } = useWindowDimensions();

  // Compute the actual rendered bounds of the room image (contain mode)
  // HUD ~100px top, toolSelector ~80px bottom
  const gameAreaTop = 100;
  const gameAreaBottom = 80;
  const gameAreaH = H - gameAreaTop - gameAreaBottom;
  const gameAreaW = W;
  // Image is square (1:1), contain fits to min dimension
  const imgRenderSize = Math.min(gameAreaW, gameAreaH);
  const imgOffsetX = (gameAreaW - imgRenderSize) / 2;
  const imgOffsetY = (gameAreaH - imgRenderSize) / 2 + gameAreaTop;

  // Resolve positions relative to rendered image bounds
  const resolvedMess = useMemo(
    () => level.messObjects.map((obj) => ({
      ...obj,
      position: {
        x: imgOffsetX + obj.position.x * imgRenderSize,
        y: imgOffsetY + obj.position.y * imgRenderSize,
      },
    })),
    [level.messObjects, imgOffsetX, imgOffsetY, imgRenderSize]
  );
  const resolvedClues = useMemo(
    () => level.clues.map((c) => ({
      ...c,
      position: {
        x: imgOffsetX + c.position.x * imgRenderSize,
        y: imgOffsetY + c.position.y * imgRenderSize,
      },
    })),
    [level.clues, imgOffsetX, imgOffsetY, imgRenderSize]
  );

  // ── state ──────────────────────────────
  const [messObjects, setMessObjects] = useState<MessObjectData[]>(() =>
    resolvedMess.map((m) => ({ ...m }))
  );
  const [clueState, setClueState] = useState<ClueState>(() =>
    createClueState(resolvedClues)
  );
  const [progress, setProgress] = useState(0);
  const [timeLeft, setTimeLeft] = useState(level.timeLimit);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [mopVisible, setMopVisible] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolType>(level.tools[0]);
  const [combo, setCombo] = useState<ComboState>(createComboState);
  const [score, setScore] = useState<ScoreState>(createScoreState);
  const [result, setResult] = useState<LevelResult | null>(null);
  const [showBriefing, setShowBriefing] = useState(true);
  const [restartCount, setRestartCount] = useState(0);
  const [sparkles, setSparkles] = useState<{ id: number; pos: Position }[]>([]);
  const [cleaningParticles, setCleaningParticles] = useState<
    { id: number; pos: Position; stainType: StainType }[]
  >([]);
  const [trailPoints, setTrailPoints] = useState<{ x: number; y: number; timestamp: number }[]>([]);
  const [scrubbedIds, setScrubbedIds] = useState<Set<string>>(new Set());
  const [toastClue, setToastClue] = useState<ClueData | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [rejectFlashes, setRejectFlashes] = useState<
    { id: number; pos: Position; reason: 'wrongTool' | 'needsSpray' }[]
  >([]);
  const [tierAnnouncement, setTierAnnouncement] = useState<{ id: number; tier: ComboTier } | null>(null);

  const sparkleId = useRef(0);
  const particleId = useRef(0);
  const cleanTickCount = useRef(0);
  const rejectFlashId = useRef(0);
  const tierAnnouncementId = useRef(0);
  const lastTierRef = useRef<ComboTier>('none');
  const lastRejectRef = useRef<Record<string, number>>({});

  const messRef = useRef(messObjects);
  messRef.current = messObjects;
  const clueRef = useRef(clueState);
  clueRef.current = clueState;
  const comboRef = useRef(combo);
  comboRef.current = combo;
  const scoreRef = useRef(score);
  scoreRef.current = score;
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const mopX = useSharedValue(W / 2);
  const mopY = useSharedValue(H / 2);
  const mopAngle = useSharedValue(0);

  // ── music ──────────────────────────────
  useEffect(() => {
    SoundManager.playAdaptiveMusic(level.environment as 'apartment' | 'warehouse' | 'office');
    return () => { SoundManager.stopAdaptiveMusic(); };
  }, [level.environment]);

  // ── timer ──────────────────────────────
  useEffect(() => {
    if (gameState !== 'playing' || showBriefing) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { handleGameEnd(false, 0); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [gameState, showBriefing]);

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

  // ── music intensity driver ──────────────
  useEffect(() => {
    if (gameState !== 'playing') return;
    const interval = setInterval(() => {
      SoundManager.updateMusicIntensity({
        comboTier: getComboTier(comboRef.current.count),
        timePercent: timeLeft / level.timeLimit,
        isRush: false,
        isCleaning: mopVisible,
        progress,
      });
    }, 200);
    return () => clearInterval(interval);
  }, [gameState, timeLeft, progress, mopVisible]);

  // ── pause / resume ─────────────────────
  const togglePause = useCallback(() => {
    setGameState((s) => {
      if (s === 'playing') { stopCleaning(); SoundManager.pauseAdaptiveMusic(); return 'paused'; }
      if (s === 'paused') { SoundManager.resumeAdaptiveMusic(); return 'playing'; }
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

      const stars = won ? calculateStars(timeRemaining, level.starThresholds) : 0;

      const levelResult: LevelResult = {
        levelId: level.id,
        stars,
        score: finalScore.score,
        timeUsed: level.timeLimit - timeRemaining,
        maxCombo: comboRef.current.maxCombo,
        completed: won,
      };
      setResult(levelResult);
      setGameState(won ? 'won' : 'lost');

      // Delay showing result screen for dramatic effect
      setTimeout(() => setShowResult(true), 1200);

      SoundManager.stopAllSFX();
      if (won) {
        HapticManager.success();
        SoundManager.playSFX('levelComplete');
        const clueIds = getCollectedClueIds(clueRef.current);
        await saveSceneLevelResult(
          level.id, level.episodeId, stars, finalScore.score,
          level.timeLimit - timeRemaining, comboRef.current.maxCombo, clueIds
        );
        // Check episode completion
        const episode = getEpisode(level.episodeId);
        if (episode) {
          const prog = await loadStoryProgress();
          const done = prog.episodeProgress[level.episodeId] ?? [];
          if (done.length >= episode.levelIds.length) {
            setTimeout(() => setShowReport(true), 2500);
          }
        }
      } else {
        SoundManager.playSFX('levelFail');
      }
    },
    [level]
  );

  // ── helpers ────────────────────────────
  const addSparkle = useCallback((pos: Position) => {
    const id = sparkleId.current++;
    setSparkles((prev) => [...prev, { id, pos }]);
  }, []);

  const handleCollectClue = useCallback((clueId: string) => {
    setClueState((prev) => {
      const next = collectClue(prev, clueId);
      const clue = next.clues.find((c) => c.id === clueId);
      if (clue) {
        setToastClue(clue);
        SoundManager.playSFX('starEarned');
        HapticManager.success();
      }
      return next;
    });
  }, []);

  // ── cleaning loop ──────────────────────
  const cleaningInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCleaning = useCallback(
    (x: number, y: number) => {
      if (gameStateRef.current !== 'playing') return;
      setMopVisible(true);
      mopX.value = x;
      mopY.value = y;

      cleaningInterval.current = setInterval(() => {
        if (gameStateRef.current !== 'playing') { stopCleaning(); return; }

        const prevMess = messRef.current;
        const toolPos = { x: mopX.value, y: mopY.value };
        const allowedStains = TOOL_STAIN_MAP[activeTool];

        const { messObjects: updated, cleaned } = cleanMessTick(prevMess, toolPos, activeTool);
        setMessObjects(updated);
        messRef.current = updated;

        const inRange = getMessInRange(updated, toolPos, activeTool);
        setScrubbedIds(inRange);

        // Reject flash for wrong tool
        const now2 = Date.now();
        for (const obj of updated) {
          if (obj.dirtLevel <= 0.01) continue;
          const dist = rectDistance(toolPos, obj.position, obj.width, obj.height);
          if (dist >= 60) continue;
          if (!allowedStains.includes(obj.cleanType)) {
            const last = lastRejectRef.current[obj.id] ?? 0;
            if (now2 - last > 800) {
              lastRejectRef.current[obj.id] = now2;
              const rid = rejectFlashId.current++;
              setRejectFlashes((prev) =>
                prev.length >= 3 ? prev : [...prev, { id: rid, pos: obj.position, reason: 'wrongTool' }]
              );
              SoundManager.playSFX('reject');
            }
          }
        }

        // Clue reveals + sparkles
        for (let i = 0; i < updated.length; i++) {
          if (prevMess[i].dirtLevel > 0.01 && updated[i].dirtLevel <= 0.01) {
            addSparkle(updated[i].position);
            if (updated[i].revealsClue) {
              setClueState((cs) => revealClue(cs, updated[i].revealsClue!));
            }
          }
        }

        // Combo + score + tier announcements
        if (cleaned > 0) {
          const now = Date.now();
          let newCombo = comboRef.current;
          let newScore = scoreRef.current;
          for (let i = 0; i < cleaned; i++) {
            newCombo = onStainCleaned(newCombo, now);
            newScore = addStainScore(newScore, newCombo.multiplier);
          }
          setCombo(newCombo);
          comboRef.current = newCombo;
          setScore(newScore);
          scoreRef.current = newScore;

          const currentTier = getComboTier(newCombo.count);
          if (currentTier !== lastTierRef.current && currentTier !== 'none') {
            lastTierRef.current = currentTier;
            const tid = tierAnnouncementId.current++;
            setTierAnnouncement({ id: tid, tier: currentTier });
            SoundManager.playSFX('comboUp');
            HapticManager.warning();
          }

          if (currentTier === 'blazing' || currentTier === 'inferno') HapticManager.heavy();
          else if (currentTier === 'hot') HapticManager.medium();
          else HapticManager.light();

          SoundManager.playSFX('stainClean');
        }

        // Cleaning particles every 3rd tick
        cleanTickCount.current++;
        if (cleanTickCount.current % 3 === 0 && inRange.size > 0) {
          setCleaningParticles((prev) => {
            if (prev.length >= 6) return prev;
            const newP: { id: number; pos: Position; stainType: StainType }[] = [];
            for (const obj of updated) {
              if (inRange.has(obj.id)) {
                newP.push({
                  id: particleId.current++,
                  pos: {
                    x: obj.position.x + (Math.random() - 0.5) * 10,
                    y: obj.position.y + (Math.random() - 0.5) * 10,
                  },
                  stainType: obj.cleanType,
                });
              }
            }
            return [...prev, ...newP].slice(0, 6);
          });
        }

        // Progress
        const prog = calculateSceneProgress(updated);
        setProgress(prog);

        if (isSceneLevelComplete(updated)) {
          stopCleaning();
          setTimeLeft((t) => { handleGameEnd(true, t); return t; });
        }
      }, 33);
    },
    [activeTool, handleGameEnd]
  );

  const moveCleaning = useCallback((x: number, y: number) => {
    mopX.value = x;
    mopY.value = y;
    setTrailPoints((prev) => {
      const now = Date.now();
      const filtered = prev.filter((p) => now - p.timestamp < 400);
      const next = [...filtered, { x, y, timestamp: now }];
      return next.length > 20 ? next.slice(-20) : next;
    });
  }, []);

  const stopCleaning = useCallback(() => {
    setMopVisible(false);
    setScrubbedIds(new Set());
    setTrailPoints([]);
    if (cleaningInterval.current) {
      clearInterval(cleaningInterval.current);
      cleaningInterval.current = null;
    }
  }, []);

  // ── gesture ────────────────────────────
  const panGesture = Gesture.Pan()
    .onStart((e) => runOnJS(startCleaning)(e.absoluteX, e.absoluteY))
    .onUpdate((e) => runOnJS(moveCleaning)(e.absoluteX, e.absoluteY))
    .onEnd(() => runOnJS(stopCleaning)())
    .minDistance(0);

  // ── navigation ─────────────────────────
  const restart = useCallback(() => {
    setMessObjects(resolvedMess.map((m) => ({ ...m })));
    setClueState(createClueState(resolvedClues));
    setProgress(0);
    setTimeLeft(level.timeLimit);
    setGameState('playing');
    setMopVisible(false);
    setCombo(createComboState());
    setScore(createScoreState());
    setResult(null);
    setSparkles([]);
    setCleaningParticles([]);
    setTrailPoints([]);
    setScrubbedIds(new Set());
    setRejectFlashes([]);
    setToastClue(null);
    setShowBriefing(true);
    setShowReport(false);
    setShowResult(false);
    setTierAnnouncement(null);
    lastTierRef.current = 'none';
    lastRejectRef.current = {};
    setActiveTool(level.tools[0]);
    setRestartCount((c) => c + 1);
    SoundManager.playAdaptiveMusic(level.environment as 'apartment' | 'warehouse' | 'office');
  }, [level, resolvedMess, resolvedClues]);

  const goMenu = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/story');
  }, [router]);

  const comboTier = getComboTier(combo.count);
  const episode = getEpisode(level.episodeId);
  const collectedClueIds = getCollectedClueIds(clueState);

  // ── render ─────────────────────────────
  return (
    <GestureHandlerRootView style={styles.root}>
      {/* HUD — same as classic */}
      <View style={styles.hud}>
        <View style={styles.hudRow}>
          <TimerLabel seconds={timeLeft} />
          <View style={styles.hudRight}>
            <View style={styles.clueChip}>
              <Text style={styles.clueIcon}>🔍</Text>
              <Text style={styles.clueText}>
                {collectedClueIds.length}/{level.clues.length}
              </Text>
            </View>
            <View style={styles.scoreChip}>
              <Ionicons name="flash" size={12} color={Colors.tertiary} />
              <Text style={styles.scoreText}>{score.score}</Text>
            </View>
            <TouchableOpacity style={styles.pauseBtn} onPress={togglePause}>
              <Ionicons name="pause" size={16} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
        <ProgressBar progress={progress} />
      </View>

      {/* Combo — floats below HUD */}
      <View style={styles.comboFloater} pointerEvents="none">
        <ComboDisplay combo={combo.count} multiplier={combo.multiplier} comboTier={comboTier} />
      </View>

      {/* Game area — clean room background, full room visible */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={styles.gameArea}>
          <ImageBackground source={level.scene.cleanImage} style={styles.floor} resizeMode="contain" imageStyle={styles.floorImage}>
            {/* Mess objects */}
            {messObjects.map((obj) => (
              <MessObject key={`${obj.id}-${restartCount}`} object={obj} isBeingScrubbed={scrubbedIds.has(obj.id)} />
            ))}

            {/* Revealed clues */}
            {clueState.clues.map((clue) => (
              <RevealedClue key={clue.id} clue={clue} onCollect={handleCollectClue} />
            ))}

            {/* Clean trail — reused from classic */}
            {mopVisible && <CleanTrail points={trailPoints} tool={activeTool} />}

            {/* Cleaning particles — reused from classic */}
            {cleaningParticles.map((cp) => (
              <CleaningParticles
                key={cp.id}
                position={cp.pos}
                stainType={cp.stainType}
                onDone={() => setCleaningParticles((prev) => prev.filter((p) => p.id !== cp.id))}
              />
            ))}

            {/* Sparkle effects — reused from classic */}
            {sparkles.map((sp) => (
              <SparkleEffect key={sp.id} position={sp.pos} onDone={() => setSparkles((prev) => prev.filter((s) => s.id !== sp.id))} />
            ))}

            {/* Reject flashes — reused from classic */}
            {rejectFlashes.map((rf) => (
              <RejectFlash
                key={rf.id}
                position={rf.pos}
                reason={rf.reason}
                onDone={() => setRejectFlashes((prev) => prev.filter((r) => r.id !== rf.id))}
              />
            ))}

            {/* Mop — reused from classic */}
            <Mop
              x={mopX} y={mopY} angle={mopAngle}
              visible={mopVisible} tool={activeTool}
              isCleaning={scrubbedIds.size > 0} comboTier={comboTier}
            />

            {/* Combo screen edge effect — reused from classic */}
            <ComboScreenEffect comboTier={comboTier} />
          </ImageBackground>
        </Animated.View>
      </GestureDetector>

      {/* Tool selector — reused from classic */}
      <ToolSelector
        available={level.tools}
        active={activeTool}
        onSelect={(t) => { setActiveTool(t); SoundManager.playSFX('toolSwitch'); }}
      />

      {/* Clue collected toast */}
      {toastClue && <ClueCollectedToast clue={toastClue} onDone={() => setToastClue(null)} />}

      {/* Combo tier announcement — reused from classic */}
      {tierAnnouncement && (
        <ComboTierAnnouncement
          key={tierAnnouncement.id}
          tier={tierAnnouncement.tier}
          onDone={() => setTierAnnouncement(null)}
        />
      )}

      {/* Briefing overlay */}
      {showBriefing && (
        <View style={styles.briefingOverlay}>
          <View style={styles.briefingCard}>
            <Text style={styles.briefingEpisode}>{episode?.name ?? 'Story Mode'}</Text>
            <Text style={styles.briefingTitle}>{level.name}</Text>
            <Text style={styles.briefingText}>{level.briefing}</Text>
            <View style={styles.briefingClueHint}>
              <Text style={styles.clueHintIcon}>🔍</Text>
              <Text style={styles.clueHintText}>
                {level.clues.length} hidden clue{level.clues.length !== 1 ? 's' : ''} — clean to find them!
              </Text>
            </View>
            <TouchableOpacity style={styles.briefingBtn} onPress={() => setShowBriefing(false)}>
              <Text style={styles.briefingBtnText}>START CLEANING</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Pause — reused from classic */}
      {gameState === 'paused' && (
        <PauseMenu levelName={level.name} onResume={togglePause} onRestart={restart} onQuit={goMenu} />
      )}

      {/* Result — delayed appearance for dramatic effect */}
      {showResult && result && (
        <ResultScreen
          result={result}
          levelName={level.name}
          hasNextLevel={false}
          onRestart={restart}
          onNext={goMenu}
          onMenu={goMenu}
          extraStats={
            result.completed
              ? [{ label: 'Clues Found', value: `${collectedClueIds.length}/${level.clues.length}`, icon: '🔍' }]
              : undefined
          }
        />
      )}

      {/* Incident Report */}
      {showReport && episode && (
        <IncidentReport
          episode={episode}
          report={buildIncidentReport(episode, collectedClueIds)}
          onClose={() => setShowReport(false)}
        />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgDark },
  hud: {
    paddingTop: 50, backgroundColor: Colors.hudBg, zIndex: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  hudRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hudRight: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 12 },
  comboFloater: { position: 'absolute', top: 96, alignSelf: 'center', zIndex: 15 },
  clueChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,207,72,0.12)', paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,207,72,0.3)',
  },
  clueIcon: { fontSize: 12 },
  clueText: { fontFamily: Fonts.bodyBold, fontSize: 12, color: Colors.tertiary, fontVariant: ['tabular-nums'] },
  scoreChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.bgElevated, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  scoreText: { fontFamily: Fonts.bodyBold, color: Colors.tertiary, fontSize: 14, fontVariant: ['tabular-nums'] },
  pauseBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.bgElevated, justifyContent: 'center', alignItems: 'center',
  },
  gameArea: { flex: 1, backgroundColor: '#788B9A' },
  floor: { flex: 1, width: '100%', height: '100%' },
  floorImage: { borderRadius: 0 },
  briefingOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center', alignItems: 'center', zIndex: 50,
  },
  briefingCard: {
    backgroundColor: Colors.bgCard, borderRadius: 16, padding: 24, width: '85%',
    alignItems: 'center', borderWidth: 1, borderColor: Colors.tertiary,
  },
  briefingEpisode: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textLight, letterSpacing: 1, marginBottom: 4 },
  briefingTitle: { fontFamily: Fonts.heading, fontSize: 22, color: Colors.primary, marginBottom: 12, textAlign: 'center' },
  briefingText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  briefingClueHint: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,207,72,0.1)', paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8, marginBottom: 16,
  },
  clueHintIcon: { fontSize: 16 },
  clueHintText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.tertiary },
  briefingBtn: { backgroundColor: Colors.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 10 },
  briefingBtnText: { fontFamily: Fonts.bodyBold, fontSize: 15, color: Colors.bgDark, letterSpacing: 1 },
});
