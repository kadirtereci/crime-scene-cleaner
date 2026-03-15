# Crime Scene Cleaner – Project Plan

## Overview
Crime Scene Cleaner is a casual mobile cleaning simulation game.

Players restore messy environments by cleaning stains, collecting evidence,
and repairing objects before time runs out.

Platform: iOS / Android  
Engine: Expo + React Native  
Camera: Top-down  

---

## Development Phases

### Phase 1 – Core Prototype ✅ COMPLETE
Goal: Working gameplay loop.

Features:
- ✅ clean stain mechanic
- ✅ trash pickup
- ✅ progress bar
- ✅ timer

Deliverable:
- ✅ single playable level

---

### Phase 2 – MVP ✅ COMPLETE
Goal: Publishable first version.

Includes:
- ✅ 25 levels (8 apartment, 8 warehouse, 9 office)
- ✅ 5 tools (mop, scrub brush, trash bag, repair kit, spray)
- ✅ 3 environments (apartment, warehouse, office)
- ✅ 5 stain types (blood, glass, trash, evidence, broken furniture)

Systems:
- ✅ progress bar
- ✅ combo system (time-based combo chain with multiplier)
- ✅ score system (base points × combo + time bonus)
- ✅ star rating (1-3 stars per level based on time)
- ✅ progress persistence (AsyncStorage)

Screens:
- ✅ Main Menu
- ✅ Level Select (grouped by environment, locked/unlocked/completed states)
- ✅ Gameplay Screen (multi-tool, multi-environment)
- ✅ Result Screen (stars, score, combo stats, next/retry/menu)

Assets:
- ✅ 3 floor textures (apartment wood, warehouse concrete, office carpet)
- ✅ 3 wall backgrounds
- ✅ 5 stain sprites (blood, glass, trash, evidence, broken furniture)
- ✅ 5 tool sprites (mop, scrub brush, trash bag, repair kit, spray)

---

### Phase 3 – Content Expansion
Add:
- 100 levels
- upgrade system
- cosmetics

New locations:
- hotel
- bank
- nightclub

---

## Game Loop
Enter room  
↓  
Observe mess  
↓  
Select tool  
↓  
Drag to clean  
↓  
Combo builds  
↓  
Progress increases  
Room restored  
↓  
Score screen (stars + score)  
↓  
Next level  

---

## Tools
- ✅ Mop → cleans blood
- ✅ Scrub Brush → cleans blood, glass
- ✅ Trash Bag → picks up trash
- ✅ Repair Kit → fixes broken furniture
- ✅ Disinfectant Spray → cleans blood, evidence

---

## Objects
- ✅ Blood stain
- ✅ Broken glass
- ✅ Trash
- ✅ Evidence item
- ✅ Broken furniture

---

## UI Screens
- ✅ Main Menu
- ✅ Level Select
- ✅ Gameplay Screen
- ✅ Result Screen
- ◻ Upgrade Shop (Phase 3)

---

## Monetization (Phase 3)
- Rewarded ads
- Remove ads purchase
- Future level packs

---

## Project Structure

```
app/
  _layout.tsx          → Root layout (Stack navigator)
  index.tsx            → Main Menu
  levels.tsx           → Level Select
  game/[id].tsx        → Game Screen (dynamic route)

src/
  components/
    ComboDisplay.tsx   → Animated combo counter
    Mop.tsx            → Tool sprite (follows finger)
    ProgressBar.tsx    → Cleaning progress HUD
    ResultScreen.tsx   → End-of-level overlay (stars, score)
    Stain.tsx          → Stain/object sprite (5 types)
    TimerLabel.tsx     → Countdown timer HUD
    ToolSelector.tsx   → Bottom tool picker bar

  game/
    types.ts           → All type definitions
    cleaningSystem.ts  → Core cleaning logic (distance, clean rate, tool matching)
    comboSystem.ts     → Combo chain tracking + multiplier
    scoreSystem.ts     → Point calculation + time bonus
    levels.ts          → All 25 level configurations
    progressStorage.ts → AsyncStorage save/load

  screens/
    MainMenu.tsx       → Title screen with animated play button
    LevelSelect.tsx    → Grid of 25 levels grouped by environment
    GameScreen.tsx     → Main gameplay (gesture, tools, combo, score)

assets/
  environment/
    apartment/         → floor.png, wall.png
    warehouse/         → floor.png, wall.png
    office/            → floor.png, wall.png
  stains/
    blood-stain.png
    broken-glass.png
    trash.png
    evidence.png
    broken-furniture.png
  tools/
    mop.png
    scrub-brush.png
    trash-bag.png
    repair-kit.png
    spray.png
```

---


## MVP Success Criteria ✅

- ✅ Player can clean stains using drag motion
- ✅ Multiple tools with different stain affinities
- ✅ Level finishes when all stains cleaned
- ✅ Star rating rewards fast play
- ✅ Combo system adds satisfying chain mechanic
- ✅ 25 levels across 3 environments provide content variety
- ✅ Progress saves between sessions
- ✅ The experience feels satisfying (haptic feedback, animations)


---

## Screen Design Plan

### Splash Screen
Purpose: show game identity while assets load.

UI Elements
- Game logo
- Background texture
- Loading indicator

---

### Main Menu
Purpose: entry point of the game.

UI Elements
- Game logo
- Start Game button
- Level Select button
- Settings button

Layout
Top: Logo
Center: Start Game
Bottom: Level Select / Settings

---

### Level Select Screen
Purpose: choose levels.

Layout
Grid layout of level buttons.

Example
1 2 3 4 5
6 7 8 9 10

States
- Locked
- Unlocked
- Completed (star rating)

---

### Gameplay Screen
Purpose: core gameplay.

Layout
Top HUD
- Timer
- Progress bar

Center
- Room environment
- Stain objects

Bottom
- Tool selector

Interactions
- Drag mop to clean
- Tool selection for different stain types
- Combo chain increases score

---

### Result Screen
Purpose: show level results.

UI Elements
- Level Complete text
- Score
- Star rating
- Combo stats

Buttons
- Next Level
- Retry
- Main Menu

---

## Asset Generation Prompts (AI)

All assets follow style rules:
- cartoon mobile casual
- top-down perspective
- clean vector illustration
- bright color palette
- minimal shading
- transparent background

Environment Floor Prompt
"top-down wooden apartment floor texture, mobile casual game art style, clean vector illustration, bright colors, soft shadows"

Wall Background Prompt
"top-down room wall boundary background for mobile game, simple cartoon vector style, minimal shading"

Blood Stain Prompt
"cartoon blood stain splatter top-down view, dark red color, mobile game asset, clean vector illustration"

Broken Glass Prompt
"cartoon broken glass shards scattered top-down view, light reflections, mobile game asset"

Trash Item Prompt
"cartoon trash items pizza box beer bottle paper trash top-down view mobile game assets"

Evidence Item Prompt
"cartoon evidence object for crime scene cleaning game, small suspicious item top-down vector"

Broken Furniture Prompt
"cartoon broken chair pieces top-down mobile game asset clean vector illustration"

Mop Tool Prompt
"cartoon cleaning mop top-down perspective mobile game tool asset bright colors"

Scrub Brush Prompt
"cartoon cleaning scrub brush top-down mobile game asset bright colors"

Trash Bag Prompt
"cartoon trash bag tool mobile game asset top-down perspective"

Repair Kit Prompt
"cartoon repair toolkit mobile game asset top-down perspective"

Spray Bottle Prompt
"cartoon disinfectant spray bottle mobile game asset top-down perspective"

Progress Bar UI Prompt
"mobile game progress bar UI rounded rectangle green fill cartoon vector"

Button UI Prompt
"mobile game rounded UI button bright color gradient clean vector"

Star Icon Prompt
"gold cartoon star icon mobile game reward vector bright colors"
