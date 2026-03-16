/**
 * EvidenceBoardScreen — Noir detective evidence board with atmosphere
 *
 * Design: Dark cork-board aesthetic with polaroid clue cards, pushpin accents,
 * crime scene tape dividers, and typewriter-style report fragments.
 * Neon-noir palette (#FFCF48 honey, #FF2D6F magenta, acid green accents).
 */
import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
  FadeInLeft,
  FadeInRight,
  ZoomIn,
  SlideInUp,
} from 'react-native-reanimated';
import {
  EPISODES,
  loadStoryProgress,
  buildIncidentReport,
  saveDeductionAnswer,
} from '../game/episodeSystem';
import { SCENE_LEVELS } from '../game/sceneLevels';
import {
  StoryProgress,
  DEFAULT_STORY_PROGRESS,
  ClueData,
  DeductionQuestion,
  DeductionChoice,
} from '../game/storyTypes';
import { Colors, Fonts } from '../theme';
import { SoundManager } from '../audio/SoundManager';
import { HapticManager } from '../utils/hapticManager';

const { width: W } = Dimensions.get('window');

// Pseudo-random rotation for polaroid cards based on index
const CARD_ROTATIONS = [-2.5, 1.8, -1.2, 3.0, -0.8, 2.2, -3.1, 1.5];
const getRotation = (i: number) => CARD_ROTATIONS[i % CARD_ROTATIONS.length];

// Pushpin colors cycle
const PIN_COLORS = ['#FF3838', '#FFCF48', '#39FF7F', '#00D4FF', '#FF2D6F'];
const getPinColor = (i: number) => PIN_COLORS[i % PIN_COLORS.length];

// ── Crime Scene Tape Divider ────────────────────────────────
function TapeDivider({ label, delay = 0 }: { label: string; delay?: number }) {
  return (
    <Animated.View entering={FadeInLeft.delay(delay).duration(400)} style={s.tapeDivider}>
      <View style={s.tapeStripe}>
        <View style={s.tapeStripeBg}>
          {/* Diagonal stripe pattern via repeated small views */}
          <View style={s.tapeStripeInner}>
            <Text style={s.tapeText}>{label}</Text>
            <View style={s.tapeDiamond} />
            <Text style={s.tapeText}>{label}</Text>
            <View style={s.tapeDiamond} />
            <Text style={s.tapeText}>{label}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

// ── Pushpin Component ──────────────────────────────────────
function Pushpin({ color, style }: { color: string; style?: object }) {
  return (
    <View style={[s.pushpin, style]}>
      <View style={[s.pushpinHead, { backgroundColor: color }]}>
        <View style={s.pushpinShine} />
      </View>
      <View style={s.pushpinShadow} />
    </View>
  );
}

export default function EvidenceBoardScreen() {
  const { episodeId } = useLocalSearchParams<{ episodeId: string }>();
  const router = useRouter();
  const [progress, setProgress] = useState<StoryProgress>(DEFAULT_STORY_PROGRESS);
  const [selectedClue, setSelectedClue] = useState<ClueData | null>(null);

  // Deduction state
  const [activeQuestion, setActiveQuestion] = useState<DeductionQuestion | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<DeductionChoice | null>(null);
  const [answerResult, setAnswerResult] = useState<'correct' | 'wrong' | null>(null);

  const episode = EPISODES.find((e) => e.id === episodeId);

  useFocusEffect(
    useCallback(() => {
      loadStoryProgress().then(setProgress);
      setActiveQuestion(null);
      setSelectedChoice(null);
      setAnswerResult(null);
    }, [])
  );

  if (!episode) {
    return (
      <View style={s.root}>
        <Text style={s.errorText}>Episode not found</Text>
      </View>
    );
  }

  // Gather all clues
  const episodeLevels = SCENE_LEVELS.filter((l) => l.episodeId === episodeId);
  const allClues: (ClueData & { levelName: string })[] = [];
  for (const level of episodeLevels) {
    for (const clue of level.clues) {
      allClues.push({ ...clue, levelName: level.name });
    }
  }

  const collectedSet = new Set(progress.collectedClues);
  const collectedCount = allClues.filter((c) => collectedSet.has(c.id)).length;
  const report = buildIncidentReport(episode, progress.collectedClues);
  const hasBadge = progress.detectiveBadges.includes(episode.id);
  const solvedQuestions = new Set(progress.solvedDeductions[episode.id] ?? []);

  const deductionUnlocked = collectedCount > 0;
  const allSolved = episode.deductions.every((d) => solvedQuestions.has(d.id));

  // ── Deduction handlers
  const handleChoiceSelect = (choice: DeductionChoice) => {
    if (answerResult) return;
    setSelectedChoice(choice);
  };

  const handleSubmitAnswer = async () => {
    if (!activeQuestion || !selectedChoice) return;

    const isCorrect = selectedChoice.id === activeQuestion.correctChoiceId;
    setAnswerResult(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      SoundManager.playSFX('starEarned');
      HapticManager.success();
      const updated = await saveDeductionAnswer(episode.id, activeQuestion.id);
      setProgress(updated);
    } else {
      SoundManager.playSFX('reject');
      HapticManager.warning();
    }
  };

  const handleCloseQuestion = () => {
    setActiveQuestion(null);
    setSelectedChoice(null);
    setAnswerResult(null);
  };

  return (
    <View style={s.root}>
      {/* ── Atmospheric background layers ── */}
      <LinearGradient
        colors={['#1a0e08', '#0F0E17', '#110d1a']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Cork-board texture overlay */}
      <View style={s.corkOverlay} />
      {/* Vignette edges */}
      <LinearGradient
        colors={['rgba(0,0,0,0.6)', 'transparent', 'transparent', 'rgba(0,0,0,0.4)']}
        locations={[0, 0.15, 0.85, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* ══════════ HEADER ══════════ */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>

        <View style={s.headerCenter}>
          <View style={s.headerTapeBadge}>
            <Text style={s.headerTapeText}>EVIDENCE BOARD</Text>
          </View>
          <Text style={s.headerEpisode}>{episode.icon} {episode.name}</Text>
        </View>

        {hasBadge ? (
          <Animated.View entering={ZoomIn.duration(500)} style={s.badgeWrap}>
            <Text style={s.badgeEmoji}>🕵️</Text>
          </Animated.View>
        ) : (
          <View style={s.headerSpacer} />
        )}
      </View>

      {/* ══════════ CASE FILE PROGRESS ══════════ */}
      <Animated.View entering={FadeInDown.delay(100).duration(400)} style={s.caseFileCard}>
        <View style={s.caseFileTab}>
          <Text style={s.caseFileTabText}>CASE #{episode.id.toUpperCase()}</Text>
        </View>
        <View style={s.caseFileBody}>
          <View style={s.progressRow}>
            <View style={s.progressStat}>
              <Ionicons name="search" size={14} color={Colors.tertiary} />
              <Text style={s.progressStatLabel}>Evidence</Text>
              <Text style={s.progressStatValue}>{collectedCount}/{allClues.length}</Text>
            </View>
            {deductionUnlocked && (
              <View style={s.progressStat}>
                <Ionicons name="bulb" size={14} color={Colors.primary} />
                <Text style={s.progressStatLabel}>Deductions</Text>
                <Text style={[s.progressStatValue, { color: Colors.primary }]}>
                  {solvedQuestions.size}/{episode.deductions.length}
                </Text>
              </View>
            )}
          </View>

          {/* Progress track with glow */}
          <View style={s.progressTrack}>
            <Animated.View
              style={[
                s.progressFill,
                { width: `${allClues.length > 0 ? (collectedCount / allClues.length) * 100 : 0}%` },
              ]}
            >
              <LinearGradient
                colors={['#FFCF48', '#FFB800']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            {/* Glow dot at end of progress */}
            {collectedCount > 0 && collectedCount < allClues.length && (
              <View
                style={[
                  s.progressGlow,
                  { left: `${(collectedCount / allClues.length) * 100}%` },
                ]}
              />
            )}
          </View>

          <Text style={s.caseFileHint}>
            {collectedCount === 0
              ? 'Clean the scene to uncover hidden evidence...'
              : allSolved && hasBadge
              ? 'Case closed. Detective badge earned.'
              : collectedCount === allClues.length && allSolved
              ? 'All evidence collected. All deductions correct.'
              : `${allClues.length - collectedCount} piece${allClues.length - collectedCount !== 1 ? 's' : ''} of evidence remain hidden.`}
          </Text>
        </View>
      </Animated.View>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ══════════ CLUE GRID — POLAROID CARDS ══════════ */}
        <TapeDivider label="EVIDENCE" delay={150} />

        <View style={s.clueGrid}>
          {allClues.map((clue, index) => {
            const isCollected = collectedSet.has(clue.id);
            const rotation = isCollected ? getRotation(index) : 0;
            const pinColor = getPinColor(index);

            return (
              <Animated.View
                key={clue.id}
                entering={FadeInDown.delay(200 + index * 80).duration(400).springify()}
                style={{ transform: [{ rotate: `${rotation}deg` }] }}
              >
                <TouchableOpacity
                  style={[s.polaroid, isCollected ? s.polaroidCollected : s.polaroidLocked]}
                  activeOpacity={isCollected ? 0.7 : 1}
                  onPress={() => isCollected && setSelectedClue(clue)}
                >
                  {/* Pushpin */}
                  <Pushpin color={isCollected ? pinColor : '#555'} style={s.polaroidPin} />

                  {/* Icon area */}
                  <View style={[s.polaroidImage, isCollected && s.polaroidImageCollected]}>
                    <Text style={s.polaroidEmoji}>{isCollected ? clue.icon : '?'}</Text>
                    {isCollected && <View style={s.polaroidGlow} />}
                  </View>

                  {/* Label strip */}
                  <View style={s.polaroidLabel}>
                    <Text style={[s.polaroidName, !isCollected && s.polaroidNameLocked]} numberOfLines={1}>
                      {isCollected ? clue.name : '???'}
                    </Text>
                    <Text style={s.polaroidLevel}>
                      {isCollected ? clue.levelName : 'CLASSIFIED'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* ══════════ DEDUCTIONS — CASE FILE STYLE ══════════ */}
        <TapeDivider label="DEDUCTIONS" delay={350} />

        {!deductionUnlocked ? (
          <Animated.View entering={FadeIn.delay(400).duration(300)} style={s.lockedSection}>
            <Ionicons name="lock-closed" size={18} color={Colors.textLight} />
            <Text style={s.lockedText}>Collect evidence to unlock case deductions</Text>
          </Animated.View>
        ) : (
          episode.deductions.map((q, qi) => {
            const isSolved = solvedQuestions.has(q.id);
            const hasRelatedClue = q.relatedClueIds.some((cid) => collectedSet.has(cid));

            return (
              <Animated.View
                key={q.id}
                entering={(qi % 2 === 0 ? FadeInLeft : FadeInRight).delay(400 + qi * 120).duration(400)}
              >
                <TouchableOpacity
                  style={[
                    s.questionCard,
                    isSolved && s.questionSolved,
                    !hasRelatedClue && s.questionLocked,
                  ]}
                  activeOpacity={hasRelatedClue && !isSolved ? 0.7 : 1}
                  onPress={() => {
                    if (hasRelatedClue && !isSolved) {
                      setActiveQuestion(q);
                      setSelectedChoice(null);
                      setAnswerResult(null);
                    }
                  }}
                >
                  {/* Case file tab */}
                  <View style={[s.qTab, isSolved && s.qTabSolved]}>
                    <Text style={s.qTabText}>Q{qi + 1}</Text>
                    {isSolved ? (
                      <Ionicons name="checkmark-circle" size={14} color={Colors.bgDark} />
                    ) : !hasRelatedClue ? (
                      <Ionicons name="lock-closed" size={12} color={Colors.textLight} />
                    ) : (
                      <View style={s.qPulse} />
                    )}
                  </View>

                  <Text style={[s.qText, !hasRelatedClue && s.qTextLocked]}>
                    {hasRelatedClue ? q.question : 'Insufficient evidence. Collect more clues...'}
                  </Text>

                  {isSolved && (
                    <View style={s.qStampWrap}>
                      <Text style={s.qStamp}>SOLVED</Text>
                    </View>
                  )}

                  {hasRelatedClue && !isSolved && (
                    <View style={s.qHints}>
                      <Text style={s.qHintLabel}>Related evidence:</Text>
                      <View style={s.qHintRow}>
                        {q.relatedClueIds.map((cid) => {
                          const c = allClues.find((a) => a.id === cid);
                          const found = collectedSet.has(cid);
                          return (
                            <View key={cid} style={[s.qHintChip, found && s.qHintChipFound]}>
                              <Text style={[s.qHintChipText, found && s.qHintChipTextFound]}>
                                {found ? `${c?.icon ?? '?'} ${c?.name ?? ''}` : '? ???'}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })
        )}

        {/* ══════════ INCIDENT REPORT — TYPEWRITER STYLE ══════════ */}
        <TapeDivider label="REPORT" delay={500} />

        <View style={s.reportContainer}>
          {/* Report "paper" header */}
          <View style={s.reportHeader}>
            <View style={s.reportStamp}>
              <Text style={s.reportStampText}>
                {report.isComplete ? 'DECLASSIFIED' : 'CLASSIFIED'}
              </Text>
            </View>
            <Text style={s.reportTitle}>INCIDENT REPORT</Text>
            <Text style={s.reportSubtitle}>
              Case #{episode.id.toUpperCase()} — {report.completionPercent}% Complete
            </Text>
          </View>

          {report.fragments.map((frag, i) => (
            <Animated.View key={i} entering={FadeInDown.delay(550 + i * 100).duration(400)}>
              <View style={[s.reportFrag, frag.isRevealed ? s.reportFragRevealed : s.reportFragRedacted]}>
                {/* Fragment number */}
                <View style={s.fragNum}>
                  <Text style={s.fragNumText}>{String(i + 1).padStart(2, '0')}</Text>
                  <View style={[s.fragDot, frag.isRevealed && s.fragDotRevealed]} />
                </View>

                {/* Content */}
                <View style={s.fragContent}>
                  {frag.isRevealed ? (
                    <Text style={s.fragText}>{frag.text}</Text>
                  ) : (
                    <View>
                      <Text style={s.fragTextRedacted}>{frag.text}</Text>
                      {/* Redaction bars */}
                      <View style={s.redactionOverlay}>
                        <View style={[s.redactionBar, { width: '90%', marginBottom: 6 }]} />
                        <View style={[s.redactionBar, { width: '75%', marginBottom: 6 }]} />
                        <View style={[s.redactionBar, { width: '60%' }]} />
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* ══════════ DETECTIVE BADGE ══════════ */}
        {hasBadge && (
          <Animated.View entering={SlideInUp.delay(700).duration(600).springify()} style={s.detectiveSection}>
            <LinearGradient
              colors={['rgba(255,207,72,0.15)', 'rgba(255,207,72,0.05)', 'rgba(255,207,72,0.15)']}
              style={s.detectiveGradient}
            >
              <View style={s.detectiveShield}>
                <View style={s.detectiveShieldInner}>
                  <Text style={s.detectiveShieldEmoji}>🕵️</Text>
                </View>
              </View>
              <Text style={s.detectiveTitle}>MASTER DETECTIVE</Text>
              <View style={s.detectiveDivider} />
              <Text style={s.detectiveDesc}>
                All evidence collected{'\n'}Case solved correctly
              </Text>
              <View style={s.detectiveStars}>
                {[0, 1, 2].map((i) => (
                  <Animated.View key={i} entering={ZoomIn.delay(900 + i * 150).duration(300)}>
                    <Ionicons name="star" size={20} color={Colors.tertiary} />
                  </Animated.View>
                ))}
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* ═══════════════════════════════════════
           CLUE DETAIL MODAL — Evidence Bag Style
         ═══════════════════════════════════════ */}
      {selectedClue && (
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setSelectedClue(null)}>
          <Animated.View entering={ZoomIn.duration(300).springify()} style={s.evidenceModal}>
            {/* Evidence tag */}
            <View style={s.evidenceTag}>
              <Text style={s.evidenceTagText}>EVIDENCE</Text>
            </View>

            {/* Icon with glow */}
            <View style={s.evidenceIconWrap}>
              <View style={s.evidenceIconGlow} />
              <Text style={s.evidenceIcon}>{selectedClue.icon}</Text>
            </View>

            <Text style={s.evidenceName}>{selectedClue.name}</Text>

            <View style={s.evidenceDivider} />

            <Text style={s.evidenceDesc}>{selectedClue.description}</Text>

            <View style={s.evidenceMeta}>
              <View style={s.evidenceMetaRow}>
                <Ionicons name="location" size={12} color={Colors.tertiary} />
                <Text style={s.evidenceMetaText}>
                  {(selectedClue as ClueData & { levelName: string }).levelName}
                </Text>
              </View>
              <View style={s.evidenceMetaRow}>
                <Ionicons name="document-text" size={12} color={Colors.tertiary} />
                <Text style={s.evidenceMetaText}>
                  Report Fragment #{selectedClue.reportFragmentIndex + 1}
                </Text>
              </View>
            </View>

            {/* Collected stamp */}
            <View style={s.collectedStamp}>
              <Text style={s.collectedStampText}>COLLECTED</Text>
            </View>

            <TouchableOpacity style={s.evidenceCloseBtn} onPress={() => setSelectedClue(null)}>
              <Text style={s.evidenceCloseBtnText}>DISMISS</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      )}

      {/* ═══════════════════════════════════════
           DEDUCTION QUESTION MODAL
         ═══════════════════════════════════════ */}
      {activeQuestion && (
        <View style={s.modalOverlay}>
          <Animated.View entering={FadeInDown.duration(350).springify()} style={s.deductionModal}>
            {/* Header with interrogation lamp feel */}
            <LinearGradient
              colors={['rgba(255,207,72,0.12)', 'transparent']}
              style={s.dmHeaderGlow}
            />

            <View style={s.dmHeader}>
              <View style={s.dmHeaderBadge}>
                <Ionicons name="bulb" size={14} color={Colors.bgDark} />
                <Text style={s.dmHeaderBadgeText}>DEDUCTION</Text>
              </View>
              <TouchableOpacity onPress={handleCloseQuestion} style={s.dmCloseBtn}>
                <Ionicons name="close" size={20} color={Colors.textLight} />
              </TouchableOpacity>
            </View>

            <Text style={s.dmQuestion}>{activeQuestion.question}</Text>

            {/* Related evidence chips */}
            <View style={s.dmClueHints}>
              {activeQuestion.relatedClueIds.map((cid) => {
                const c = allClues.find((a) => a.id === cid);
                const found = collectedSet.has(cid);
                return found && c ? (
                  <View key={cid} style={s.dmClueChip}>
                    <Text style={s.dmClueChipText}>{c.icon} {c.name}</Text>
                  </View>
                ) : null;
              })}
            </View>

            {/* Choices */}
            <ScrollView style={s.dmChoices} showsVerticalScrollIndicator={false}>
              {activeQuestion.choices.map((choice, ci) => {
                const isSelected = selectedChoice?.id === choice.id;
                const isCorrectChoice = choice.id === activeQuestion.correctChoiceId;
                const showCorrect = answerResult && isCorrectChoice;
                const showWrong = answerResult === 'wrong' && isSelected && !isCorrectChoice;

                return (
                  <Animated.View key={choice.id} entering={FadeInDown.delay(100 + ci * 60).duration(250)}>
                    <TouchableOpacity
                      style={[
                        s.dmChoice,
                        isSelected && !answerResult && s.dmChoiceSelected,
                        showCorrect && s.dmChoiceCorrect,
                        showWrong && s.dmChoiceWrong,
                      ]}
                      activeOpacity={answerResult ? 1 : 0.7}
                      onPress={() => handleChoiceSelect(choice)}
                    >
                      <View style={[
                        s.dmChoiceMarker,
                        isSelected && !answerResult && s.dmChoiceMarkerSelected,
                        showCorrect && s.dmChoiceMarkerCorrect,
                        showWrong && s.dmChoiceMarkerWrong,
                      ]}>
                        {showCorrect && <Ionicons name="checkmark" size={12} color="#fff" />}
                        {showWrong && <Ionicons name="close" size={12} color="#fff" />}
                        {!answerResult && !isSelected && (
                          <Text style={s.dmChoiceMarkerLetter}>
                            {String.fromCharCode(65 + ci)}
                          </Text>
                        )}
                      </View>
                      <Text style={[
                        s.dmChoiceText,
                        showCorrect && s.dmChoiceTextCorrect,
                        showWrong && s.dmChoiceTextWrong,
                      ]}>
                        {choice.text}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </ScrollView>

            {/* Feedback */}
            {answerResult && selectedChoice && (
              <Animated.View entering={FadeInDown.duration(250)} style={[
                s.dmFeedback,
                answerResult === 'correct' ? s.dmFeedbackCorrect : s.dmFeedbackWrong,
              ]}>
                <View style={[
                  s.dmFeedbackBadge,
                  { backgroundColor: answerResult === 'correct' ? Colors.success : '#FF3838' },
                ]}>
                  <Ionicons
                    name={answerResult === 'correct' ? 'checkmark' : 'close'}
                    size={14}
                    color="#fff"
                  />
                </View>
                <Text style={s.dmFeedbackText}>{selectedChoice.feedback}</Text>
              </Animated.View>
            )}

            {/* Actions */}
            <View style={s.dmActions}>
              {!answerResult && (
                <TouchableOpacity
                  style={[s.dmSubmitBtn, !selectedChoice && s.dmSubmitBtnDisabled]}
                  onPress={handleSubmitAnswer}
                  disabled={!selectedChoice}
                >
                  <Ionicons name="arrow-forward" size={16} color={Colors.bgDark} />
                  <Text style={s.dmSubmitBtnText}>SUBMIT DEDUCTION</Text>
                </TouchableOpacity>
              )}
              {answerResult === 'correct' && (
                <TouchableOpacity style={s.dmSuccessBtn} onPress={handleCloseQuestion}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.bgDark} />
                  <Text style={s.dmSuccessBtnText}>CASE UPDATED</Text>
                </TouchableOpacity>
              )}
              {answerResult === 'wrong' && (
                <View style={s.dmRetryRow}>
                  <TouchableOpacity style={s.dmRetryBtn} onPress={() => {
                    setSelectedChoice(null);
                    setAnswerResult(null);
                  }}>
                    <Ionicons name="refresh" size={14} color={Colors.bgDark} />
                    <Text style={s.dmRetryBtnText}>RETRY</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.dmSkipBtn} onPress={handleCloseQuestion}>
                    <Text style={s.dmSkipBtnText}>DISMISS</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

// ═══════════════════════════════════════════════════════════
// STYLES — Noir Detective Board
// ═══════════════════════════════════════════════════════════

const PAPER_BG = '#f5f0e8';

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0808' },

  // ── Atmosphere ──
  corkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(80,50,20,0.06)',
  },

  // ── Header ──
  header: {
    paddingTop: 54,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerCenter: { flex: 1 },
  headerTapeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.tertiary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
    transform: [{ rotate: '-1deg' }],
  },
  headerTapeText: {
    fontFamily: Fonts.heading,
    fontSize: 9,
    color: Colors.bgDark,
    letterSpacing: 2.5,
  },
  headerEpisode: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  badgeWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,207,72,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,207,72,0.4)',
  },
  badgeEmoji: { fontSize: 22 },
  headerSpacer: { width: 40 },

  // ── Crime Scene Tape Divider ──
  tapeDivider: {
    marginVertical: 16,
    marginHorizontal: -16,
    overflow: 'hidden',
  },
  tapeStripe: {
    transform: [{ rotate: '-1.2deg' }],
    marginHorizontal: -8,
  },
  tapeStripeBg: {
    backgroundColor: Colors.tertiary,
    paddingVertical: 4,
    borderTopWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#8B6914',
  },
  tapeStripeInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  tapeText: {
    fontFamily: Fonts.heading,
    fontSize: 10,
    color: Colors.bgDark,
    letterSpacing: 3,
  },
  tapeDiamond: {
    width: 6,
    height: 6,
    backgroundColor: Colors.bgDark,
    transform: [{ rotate: '45deg' }],
  },

  // ── Pushpin ──
  pushpin: {
    position: 'absolute',
    zIndex: 10,
    alignItems: 'center',
  },
  pushpinHead: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.3)',
  },
  pushpinShine: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  pushpinShadow: {
    width: 8,
    height: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
    marginTop: 1,
  },

  // ── Case File Progress ──
  caseFileCard: {
    marginHorizontal: 16,
    borderRadius: 0,
    overflow: 'hidden',
  },
  caseFileTab: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.tertiary,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  caseFileTabText: {
    fontFamily: Fonts.heading,
    fontSize: 9,
    color: Colors.bgDark,
    letterSpacing: 2,
  },
  caseFileBody: {
    backgroundColor: 'rgba(30,20,16,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,207,72,0.2)',
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    padding: 14,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 10,
  },
  progressStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  progressStatLabel: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textSecondary,
  },
  progressStatValue: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.tertiary,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'visible',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressGlow: {
    position: 'absolute',
    top: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.tertiary,
    marginLeft: -5,
    shadowColor: Colors.tertiary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  caseFileHint: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingTop: 4 },

  // ── Polaroid Clue Cards ──
  clueGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  polaroid: {
    width: (W - 64) / 3,
    borderRadius: 3,
    padding: 6,
    paddingBottom: 10,
    alignItems: 'center',
  },
  polaroidCollected: {
    backgroundColor: PAPER_BG,
    shadowColor: Colors.tertiary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  polaroidLocked: {
    backgroundColor: 'rgba(40,35,30,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  polaroidPin: {
    top: -6,
    alignSelf: 'center',
  },
  polaroidImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  polaroidImageCollected: {
    backgroundColor: 'rgba(255,207,72,0.08)',
  },
  polaroidEmoji: { fontSize: 32 },
  polaroidGlow: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: 'rgba(255,207,72,0.15)',
    borderRadius: 2,
  },
  polaroidLabel: {
    alignItems: 'center',
    gap: 1,
  },
  polaroidName: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: '#2a2420',
    textAlign: 'center',
  },
  polaroidNameLocked: { color: Colors.textLight },
  polaroidLevel: {
    fontFamily: Fonts.body,
    fontSize: 8,
    color: '#8a7a6a',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ── Deduction Questions ──
  lockedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    borderStyle: 'dashed',
  },
  lockedText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.textLight, flex: 1, fontStyle: 'italic' },

  questionCard: {
    backgroundColor: 'rgba(26,26,46,0.8)',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.tertiary,
  },
  questionSolved: {
    borderLeftColor: Colors.success,
    backgroundColor: 'rgba(57,255,127,0.04)',
    borderColor: 'rgba(57,255,127,0.12)',
  },
  questionLocked: { opacity: 0.35 },

  qTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,207,72,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 8,
  },
  qTabSolved: { backgroundColor: Colors.success },
  qTabText: {
    fontFamily: Fonts.heading,
    fontSize: 10,
    color: Colors.tertiary,
    letterSpacing: 1,
  },
  qPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.tertiary,
  },

  qText: { fontFamily: Fonts.bodyBold, fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },
  qTextLocked: { color: Colors.textLight, fontStyle: 'italic' },

  qStampWrap: {
    position: 'absolute',
    top: 10,
    right: 10,
    transform: [{ rotate: '12deg' }],
  },
  qStamp: {
    fontFamily: Fonts.heading,
    fontSize: 14,
    color: Colors.success,
    borderWidth: 2,
    borderColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    opacity: 0.6,
  },

  qHints: { marginTop: 10, gap: 4 },
  qHintLabel: { fontFamily: Fonts.body, fontSize: 10, color: Colors.textLight },
  qHintRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  qHintChip: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  qHintChipFound: {
    backgroundColor: 'rgba(255,207,72,0.08)',
    borderColor: 'rgba(255,207,72,0.2)',
  },
  qHintChipText: { fontFamily: Fonts.body, fontSize: 10, color: Colors.textLight },
  qHintChipTextFound: { color: Colors.tertiary },

  // ── Incident Report ──
  reportContainer: {
    backgroundColor: 'rgba(245,240,232,0.03)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  reportHeader: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  reportStamp: {
    borderWidth: 2,
    borderColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 3,
    transform: [{ rotate: '-3deg' }],
    marginBottom: 8,
  },
  reportStampText: {
    fontFamily: Fonts.heading,
    fontSize: 10,
    color: Colors.secondary,
    letterSpacing: 2,
  },
  reportTitle: {
    fontFamily: Fonts.heading,
    fontSize: 14,
    color: Colors.textPrimary,
    letterSpacing: 2,
  },
  reportSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  reportFrag: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.03)',
    gap: 10,
  },
  reportFragRevealed: {},
  reportFragRedacted: { opacity: 0.7 },

  fragNum: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 2,
  },
  fragNumText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.textLight,
    letterSpacing: 1,
  },
  fragDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  fragDotRevealed: {
    backgroundColor: Colors.success,
    shadowColor: Colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },

  fragContent: { flex: 1 },
  fragText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 19,
  },
  fragTextRedacted: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: 'transparent',
    lineHeight: 19,
  },
  redactionOverlay: {
    position: 'absolute',
    top: 2,
    left: 0,
    right: 0,
  },
  redactionBar: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 2,
  },

  // ── Detective Badge ──
  detectiveSection: { marginTop: 8 },
  detectiveGradient: {
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,207,72,0.3)',
  },
  detectiveShield: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,207,72,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255,207,72,0.3)',
  },
  detectiveShieldInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,207,72,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detectiveShieldEmoji: { fontSize: 28 },
  detectiveTitle: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    color: Colors.tertiary,
    letterSpacing: 3,
  },
  detectiveDivider: {
    width: 40,
    height: 2,
    backgroundColor: 'rgba(255,207,72,0.3)',
    marginVertical: 10,
    borderRadius: 1,
  },
  detectiveDesc: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  detectiveStars: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },

  // ── Evidence Detail Modal ──
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 200,
  },
  evidenceModal: {
    width: '84%',
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,207,72,0.25)',
    overflow: 'hidden',
  },
  evidenceTag: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.tertiary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderBottomLeftRadius: 8,
  },
  evidenceTagText: {
    fontFamily: Fonts.heading,
    fontSize: 8,
    color: Colors.bgDark,
    letterSpacing: 2,
  },
  evidenceIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 4,
  },
  evidenceIconGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 36,
    backgroundColor: 'rgba(255,207,72,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,207,72,0.15)',
  },
  evidenceIcon: { fontSize: 40 },
  evidenceName: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  evidenceDivider: {
    width: 30,
    height: 2,
    backgroundColor: 'rgba(255,207,72,0.3)',
    marginBottom: 12,
    borderRadius: 1,
  },
  evidenceDesc: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 16,
  },
  evidenceMeta: { gap: 6, marginBottom: 16, alignSelf: 'stretch' },
  evidenceMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  evidenceMetaText: {
    fontFamily: Fonts.body,
    fontSize: 11,
    color: Colors.textLight,
  },
  collectedStamp: {
    borderWidth: 2,
    borderColor: Colors.success,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 4,
    transform: [{ rotate: '-6deg' }],
    marginBottom: 16,
    opacity: 0.7,
  },
  collectedStampText: {
    fontFamily: Fonts.heading,
    fontSize: 12,
    color: Colors.success,
    letterSpacing: 2,
  },
  evidenceCloseBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 8,
  },
  evidenceCloseBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.bgDark,
    letterSpacing: 1,
  },

  // ── Deduction Modal ──
  deductionModal: {
    width: '92%',
    maxHeight: '85%',
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,207,72,0.2)',
    overflow: 'hidden',
  },
  dmHeaderGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  dmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  dmHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.tertiary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  dmHeaderBadgeText: {
    fontFamily: Fonts.heading,
    fontSize: 9,
    color: Colors.bgDark,
    letterSpacing: 2,
  },
  dmCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dmQuestion: {
    fontFamily: Fonts.heading,
    fontSize: 17,
    color: Colors.textPrimary,
    lineHeight: 24,
    marginBottom: 12,
  },
  dmClueHints: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  dmClueChip: {
    backgroundColor: 'rgba(255,207,72,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,207,72,0.15)',
  },
  dmClueChipText: { fontFamily: Fonts.body, fontSize: 11, color: Colors.tertiary },
  dmChoices: { maxHeight: 220, marginBottom: 12 },
  dmChoice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  dmChoiceSelected: {
    borderColor: Colors.tertiary,
    backgroundColor: 'rgba(255,207,72,0.06)',
  },
  dmChoiceCorrect: {
    borderColor: Colors.success,
    backgroundColor: 'rgba(57,255,127,0.06)',
  },
  dmChoiceWrong: {
    borderColor: '#FF3838',
    backgroundColor: 'rgba(255,56,56,0.06)',
  },
  dmChoiceMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dmChoiceMarkerSelected: {
    borderColor: Colors.tertiary,
    backgroundColor: 'rgba(255,207,72,0.2)',
  },
  dmChoiceMarkerCorrect: {
    borderColor: Colors.success,
    backgroundColor: Colors.success,
  },
  dmChoiceMarkerWrong: {
    borderColor: '#FF3838',
    backgroundColor: '#FF3838',
  },
  dmChoiceMarkerLetter: {
    fontFamily: Fonts.bodyBold,
    fontSize: 10,
    color: Colors.textLight,
  },
  dmChoiceText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.textPrimary,
    flex: 1,
    lineHeight: 18,
  },
  dmChoiceTextCorrect: { color: Colors.success },
  dmChoiceTextWrong: { color: '#ff6666' },
  dmFeedback: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  dmFeedbackCorrect: {
    backgroundColor: 'rgba(57,255,127,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(57,255,127,0.15)',
  },
  dmFeedbackWrong: {
    backgroundColor: 'rgba(255,56,56,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,56,56,0.15)',
  },
  dmFeedbackBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  dmFeedbackText: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 17,
  },
  dmActions: {},
  dmSubmitBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.tertiary,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dmSubmitBtnDisabled: { opacity: 0.35 },
  dmSubmitBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.bgDark,
    letterSpacing: 1,
  },
  dmSuccessBtn: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.success,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dmSuccessBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.bgDark,
    letterSpacing: 1,
  },
  dmRetryRow: { flexDirection: 'row', gap: 10 },
  dmRetryBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    backgroundColor: Colors.tertiary,
    paddingVertical: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dmRetryBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.bgDark,
    letterSpacing: 1,
  },
  dmSkipBtn: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dmSkipBtnText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 13,
    color: Colors.textSecondary,
    letterSpacing: 1,
  },

  errorText: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 100,
  },
});
