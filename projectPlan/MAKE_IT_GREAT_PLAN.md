# Crime Scene Cleaner — Make It Great Plan

## Context
The game has a solid foundation (25 levels, combo/score systems, gesture cleaning, progress persistence) but feels like a prototype visually. The goal is a complete polish pass across 4 areas: **UI/UX redesign**, **visual effects & animations**, **sound & music**, and **tutorial/onboarding** — all in a **bright & playful cartoon casual** style.

---

## New Packages
```
expo-av          # Sound effects + background music
expo-blur        # Frosted glass pause menu overlay
expo-linear-gradient  # Gradient backgrounds & progress bar
expo-asset       # Preload all images + audio at startup
```

---

## Phase 1: Theme Foundation & Asset Preloading

### 1.1 Create theme system
- **New file: `src/theme/colors.ts`** — Bright playful palette:
  - Primary: `#FF6B6B` (coral), Secondary: `#4ECDC4` (teal), Accent: `#FFE66D` (yellow)
  - Success: `#7BED9F`, Warning: `#FF9F43`, Danger: `#EE5A24`
  - Backgrounds: `#F7F1E3` (warm cream), `#FFFFFF` (cards)
  - Text: `#2C3E50` (primary), `#7F8C8D` (secondary)
  - Environment: Apartment `#E17055`, Warehouse `#636E72`, Office `#6C5CE7`
- **New file: `src/theme/index.ts`** — Re-export

### 1.2 AnimatedButton component
- **New file: `src/components/ui/AnimatedButton.tsx`**
- Replaces all TouchableOpacity buttons across the app
- Press: `withSpring` scale to 0.92, release: bounce back to 1.0
- Variants: primary (coral), secondary (teal), ghost, danger

### 1.3 Asset preloading
- **Modify: `app/_layout.tsx`** — Use `expo-asset` `Asset.loadAsync()` to preload all stain images, tool images, floor/wall textures at startup before hiding splash screen

---

## Phase 2: UI/UX Redesign (Bright & Playful)

### 2.1 MainMenu (`src/screens/MainMenu.tsx`)
- Warm cream background with `expo-linear-gradient`
- Styled text logo (replace 🧹 emoji) with coral "CRIME SCENE" + charcoal "CLEANER"
- Logo wobble animation, bouncy play button with glow
- Staggered entrance animations (logo slides down, button bounces up)
- Sound mute toggle icon

### 2.2 LevelSelect (`src/screens/LevelSelect.tsx`)
- Cream background, white cards with colored left border per environment
- Environment section headers with icons, better visual hierarchy
- Stars in yellow with glow, "NEW" badge bouncing animation
- Card stagger entrance with `FadeInDown` per card

### 2.3 GameScreen HUD (`src/screens/GameScreen.tsx`)
- White semi-transparent HUD bar with shadow (replace dark bar)
- Score counter visible during gameplay
- Replace emoji icons with `@expo/vector-icons` Ionicons

### 2.4 ToolSelector (`src/components/ToolSelector.tsx`)
- White background with shadow, teal border on active tool
- Active tool springs to scale 1.1, smooth selection transition

### 2.5 PauseMenu (`src/components/PauseMenu.tsx`)
- `expo-blur` BlurView overlay (fallback to semi-transparent on Android)
- Card entrance: scale 0.8→1.0 with spring + fade
- AnimatedButton components, Ionicons replacing emojis

---

## Phase 3: Visual Effects & Animations

### 3.1 Stain cleaning effects
- **Modify: `src/components/Stain.tsx`** — Convert to reanimated:
  - Scale shrinks as dirtLevel decreases (1.0 → 0.7)
  - Pop animation on full clean (scale 1.3 → 0, opacity fade)
- **New file: `src/components/effects/SparkleEffect.tsx`** — 6-8 particles burst outward on stain clean, fade over 400ms

### 3.2 Combo enhancements (`src/components/ComboDisplay.tsx`)
- More dramatic spring (scale to 1.4), rotation wobble on increase
- Color tiers: orange at 3x, red+shake at 7x
- "Fire" glow text shadow at high combos

### 3.3 Progress bar animation (`src/components/ProgressBar.tsx`)
- Animated fill width with `withTiming`, teal→green gradient
- Shimmer effect on leading edge

### 3.4 Timer animation (`src/components/TimerLabel.tsx`)
- Pulsing scale + red glow when ≤10s
- Faster pulse at ≤5s, optional red vignette overlay on game screen

### 3.5 Result screen celebration
- **New file: `src/components/effects/ConfettiEffect.tsx`** — 25 colored pieces fall from top on win
- **Modify: `src/components/ResultScreen.tsx`**:
  - Card slides up with spring animation
  - Stars pop in one-by-one with staggered `withDelay` + `withSpring`
  - Score numbers count up from 0
  - Confetti behind card on win

### 3.6 Tool/Mop effects (`src/components/Mop.tsx`)
- Cleaning radius indicator (pulsing teal circle)
- 360° spin animation on tool switch

---

## Phase 4: Sound & Music

### 4.1 Sound manager
- **New file: `src/audio/SoundManager.ts`** — Singleton module:
  - `init()` — preload all SFX via `expo-av`, set audio mode
  - `playSFX(key)` / `stopSFX(key)` — one-shot and looping SFX
  - `playMusic(track)` / `stopMusic()` / `pauseMusic()` / `resumeMusic()`
  - `setSFXEnabled()` / `setMusicEnabled()` — persisted to AsyncStorage
- **New file: `src/audio/audioPrefs.ts`** — AsyncStorage for mute prefs

### 4.2 Sound effects needed (`assets/sounds/*.mp3`)
| Key | Trigger | Type |
|-----|---------|------|
| `scrub` | Dragging over stain | Loop |
| `stain-clean` | Stain fully cleaned | One-shot |
| `combo-up` | Combo hits 3, 5, 8, 10 | One-shot |
| `tool-switch` | Tool selected | One-shot |
| `button-tap` | Any UI button | One-shot |
| `level-complete` | Win | One-shot |
| `level-fail` | Lose | One-shot |
| `star-earned` | Star reveal on result | One-shot |
| `timer-warning` | Timer ≤10s | Loop |

### 4.3 Music tracks (`assets/music/*.mp3`)
- `menu.mp3`, `apartment.mp3`, `warehouse.mp3`, `office.mp3`

### 4.4 Integration points
- `app/_layout.tsx` — `SoundManager.init()`, menu music start
- `GameScreen.tsx` — scrub loop, stain clean pop, combo chime, timer tick, level end
- `ToolSelector.tsx` — tool switch click
- `ResultScreen.tsx` — staggered star earned SFX
- `MainMenu.tsx` / `LevelSelect.tsx` / `PauseMenu.tsx` — button taps
- `PauseMenu.tsx` — add SFX/Music toggle buttons

### 4.5 Audio asset note
Sound/music `.mp3` files need to be sourced or generated. We'll create placeholder silent files initially, then replace with real cartoon-style sounds.

---

## Phase 5: Tutorial & Onboarding

### 5.1 Tutorial system
- **New file: `src/tutorial/tutorialSteps.ts`** — Step definitions (message, target element, position)
- **New file: `src/tutorial/tutorialStorage.ts`** — AsyncStorage persistence for completed steps
- **New file: `src/tutorial/useTutorial.ts`** — Hook returning current step for a given level
- **New file: `src/components/TutorialOverlay.tsx`** — Overlay with highlight cutout + speech bubble tooltip

### 5.2 Tutorial content
**Level 1 (3 steps):**
1. "Drag your finger over stains to clean them!" → points at game area
2. "Clean every stain before time runs out!" → points at progress bar
3. "Clean stains quickly for combos!" → points at combo area

**Tool introductions (1 step each, on first appearance):**
- Level 3: "New tools! Tap to switch — different stains need different tools"
- Level 4+: Individual tool unlock messages (scrub brush, trash bag, spray, repair kit)

### 5.3 Integration
- `GameScreen.tsx` — `useTutorial(levelId, tools)` hook, render `TutorialOverlay`, pause timer during tutorial
- Steps show only once (persisted), skip-able, non-blocking for returning players

---

## Implementation Order
1. Install packages, create theme, AnimatedButton, asset preloading
2. UI/UX redesign (MainMenu → LevelSelect → GameScreen HUD → ToolSelector → PauseMenu)
3. Visual effects (Stain pop + sparkles → Combo → ProgressBar → Timer → ResultScreen + confetti)
4. Sound system (SoundManager → integrate into all screens → mute toggles)
5. Tutorial system (storage + steps → overlay component → GameScreen integration)

## Verification
- Run `npx expo start` and test on iOS simulator / Android emulator
- Verify all 25 levels play through with new visuals
- Test sound on/off, mute persistence across restart
- Test tutorial shows on fresh install (reset AsyncStorage), doesn't re-show after completion
- Test animations don't cause frame drops (check with React Native performance monitor)
- Verify Android parity (blur fallback, elevation shadows)

## Critical Files to Modify
- `app/_layout.tsx` — Asset preloading, sound init, font loading
- `src/screens/GameScreen.tsx` — HUD redesign, effects integration, sound triggers, tutorial
- `src/screens/MainMenu.tsx` — Full visual redesign
- `src/screens/LevelSelect.tsx` — Card redesign, animations
- `src/components/ResultScreen.tsx` — Star animations, confetti, card entrance
- `src/components/Stain.tsx` — Animated cleaning with pop effect
- `src/components/ToolSelector.tsx` — Bright styling, selection animation
- `src/components/ComboDisplay.tsx` — Enhanced animations
- `src/components/ProgressBar.tsx` — Animated fill
- `src/components/TimerLabel.tsx` — Warning pulse
- `src/components/PauseMenu.tsx` — Blur overlay, mute toggles
- `src/components/Mop.tsx` — Radius indicator, switch animation
