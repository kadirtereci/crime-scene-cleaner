# Crime Scene Cleaner — Mess Object Library

This document lists all mess objects used in the game.

Objects fall into several categories.

---

# 1. Stain Objects

These require cleaning tools.

Examples

- drink spill
- coffee stain
- mud footprint
- oil spill
- sticky soda stain
- food sauce stain
- paint spill
- water puddle

Special types

Sticky stain  
Slow cleaning speed

Spreading stain  
Expands over time

Hidden stain  
Under furniture

---

# 2. Trash Objects

These must be collected.

Examples

- pizza box
- paper trash
- soda cans
- plastic bottles
- food wrappers
- broken plates
- empty cups

---

# 3. Broken Objects

Require repair kit.

Examples

- broken chair
- cracked laptop
- broken lamp
- damaged monitor
- shattered mirror
- snapped table leg

---

# 4. Glass Debris

Collected or swept.

Examples

- shattered glass
- broken bottle
- broken window fragments

---

# 5. Furniture Displacement

Objects moved from original position.

Examples

- overturned chair
- moved couch
- tipped bookshelf
- fallen plant

Player must reposition.

---

# 6. Story Props

Objects that imply narrative.

Examples

- dropped phone
- cracked tablet
- unfinished letter
- spilled backpack
- broken glasses
- missing shoe
- torn notebook

These do not affect completion but add story.

---

# 7. Hidden Clues

Discovered during cleaning.

Examples

- photograph
- key
- message notification
- receipt
- ID card
- invitation

Clues add optional exploration.

---

# 8. Environmental Props

Objects that give context.

Examples

- pizza box stack
- coffee machine
- forklift
- computer desk
- lab equipment
- gym locker

---

# Object System Design

Each object has properties.

Example

object_id
object_type
clean_method
score_value
story_value

Example

pizza_box
 type: trash
 clean_method: pickup
 score_value: 5
 story_value: party_scene

coffee_stain
 type: stain
 clean_method: mop
 score_value: 10
 story_value: office_scene

broken_chair
 type: broken_object
 clean_method: repair_kit
 score_value: 15
 story_value: conflict_scene

---

# Asset Pipeline

Each object should include the following data and assets:

Sprite
Collision Box
Interaction Type
Sound Effect
Clean Animation

Recommended structure

assets/
  stains/
  trash/
  broken/
  debris/
  story_props/

Recommended resolution

1024x1024 base sprite
Scaled down for in‑game performance

---

# Object Behavior Properties

Objects can optionally include behavior rules.

Examples

spread_rate
Used for spreading liquids such as soda or oil.

fragile
Object can break further if wrong tool is used.

hidden
Object appears only after cleaning a stain.

movable
Object can be repositioned by the player.

Example object config

{
  "id": "oil_spill",
  "type": "stain",
  "clean_method": "mop",
  "spread_rate": 0.1,
  "score": 12
}

---

# Expansion Strategy

The object library should grow over time to avoid repetition.

Target milestones

Phase 1
30 core objects

Phase 2
60 objects across environments

Phase 3
100+ objects with special behaviors

Environment specific objects should be added for:

- apartments
- offices
- warehouses
- restaurants
- schools
- laboratories

This ensures that each environment feels unique and supports environmental storytelling.