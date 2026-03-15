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

### Phase 1 – Core Prototype
Goal: Working gameplay loop.

Features:
- clean stain mechanic
- trash pickup
- progress bar
- timer

Deliverable:
- single playable level

---

### Phase 2 – MVP
Goal: Publishable first version.

Includes:
- 25 levels
- 5 tools
- 3 environments

Systems:
- progress bar
- combo system
- score system

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
Use tool  
↓  
Clean objects  
↓  
Progress increases  
Room restored  
↓  
Score screen  
↓  
Next level  

---

## Tools
- Mop  
- Scrub Brush  
- Trash Bag  
- Repair Kit  
- Disinfectant Spray  

---

## Objects
- Blood stain  
- Broken glass  
- Trash  
- Evidence item  
- Broken furniture  

---

## UI Screens
- Main Menu  
- Level Select  
- Gameplay Screen  
- Result Screen  
- Upgrade Shop  

---


## Monetization
- Rewarded ads
- Remove ads purchase
- Future level packs

---

# MVP DEVELOPMENT PLAN

This section defines the **minimum playable version** of Crime Scene Cleaner.
The goal is to create a playable prototype as fast as possible.

The MVP should focus only on the **core gameplay loop**.

No upgrades, no shop, no multiple environments yet.

---

## MVP Goal

Create a **30–60 second playable level** where the player cleans stains using a mop.

If this loop is fun → continue development.
If this loop is boring → redesign the mechanic.

---

## MVP Gameplay Loop

Enter room
↓
Drag mop
↓
Clean stain
↓
Progress increases
↓
All stains cleaned
↓
Level complete

---

## MVP Features

Required features:

- Single room scene
- 5 stain objects
- 1 cleaning tool (mop)
- Drag‑to‑clean mechanic
- Progress bar
- Timer
- Level complete screen

Not included in MVP:

- Shops
- Upgrades
- Multiple rooms
- Monetization

---

## MVP Asset List

Minimum assets required:

Environment
- floor texture
- wall background

Objects
- blood stain sprite
- broken glass sprite

Tools
- mop sprite

UI
- progress bar
- timer label

Optional
- simple cleaner character

Total assets needed for MVP: ~8–10

---

## MVP Folder Structure

```
src
 ├ components
 │   ├ Mop.tsx
 │   ├ Stain.tsx
 │
 ├ game
 │   ├ cleaningSystem.ts
 │
 ├ screens
 │   ├ GameScreen.tsx

assets
 ├ stains
 ├ tools
 ├ environment
```

---

## MVP Milestones

Day 1
Expo project setup

Day 2
Drag mop mechanic

Day 3
Stain cleaning system

Day 4
Progress bar + level complete

At the end of Day 4 the game should be **playable**.

---

## MVP Success Criteria

The MVP is successful if:

- Player can clean stains using drag motion
- Level finishes when stains are cleaned
- The experience feels satisfying

If these conditions are met, development can continue to the next phase.
