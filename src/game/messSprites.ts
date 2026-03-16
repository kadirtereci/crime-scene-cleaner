/**
 * Mess Sprite Registry — maps sprite IDs to image sources and default properties
 */
import { ImageSourcePropType } from 'react-native';
import { StainType } from './types';
import { MessSpriteId } from './storyTypes';

interface MessSpriteInfo {
  source: ImageSourcePropType;
  /** Default display width */
  defaultWidth: number;
  /** Default display height */
  defaultHeight: number;
  /** Default clean type (which tool category cleans it) */
  cleanType: StainType;
  /** Default toughness */
  toughness: number;
}

/* eslint-disable @typescript-eslint/no-require-imports */
export const MESS_SPRITES: Record<MessSpriteId, MessSpriteInfo> = {
  // ── Liquids / Spills → blood (mop) ────────────────────
  spilled_coffee_mug: {
    source: require('../../assets/environment/mess_assets_named/01_01_spilled_coffee_mug.png'),
    defaultWidth: 80, defaultHeight: 60, cleanType: 'blood', toughness: 1.0,
  },
  crushed_red_can: {
    source: require('../../assets/environment/mess_assets_named/01_02_crushed_red_can.png'),
    defaultWidth: 65, defaultHeight: 50, cleanType: 'trash', toughness: 1.0,
  },
  cigarette_butt: {
    source: require('../../assets/environment/mess_assets_named/01_03_cigarette_butt.png'),
    defaultWidth: 55, defaultHeight: 40, cleanType: 'trash', toughness: 0.8,
  },
  open_pizza_box: {
    source: require('../../assets/environment/mess_assets_named/01_04_open_pizza_box.png'),
    defaultWidth: 90, defaultHeight: 68, cleanType: 'trash', toughness: 1.2,
  },
  face_mask: {
    source: require('../../assets/environment/mess_assets_named/01_05_face_mask.png'),
    defaultWidth: 60, defaultHeight: 45, cleanType: 'trash', toughness: 0.8,
  },
  cereal_bowl: {
    source: require('../../assets/environment/mess_assets_named/01_06_cereal_bowl.png'),
    defaultWidth: 70, defaultHeight: 55, cleanType: 'blood', toughness: 1.0,
  },
  dirty_tissue: {
    source: require('../../assets/environment/mess_assets_named/01_07_dirty_tissue.png'),
    defaultWidth: 55, defaultHeight: 40, cleanType: 'trash', toughness: 0.6,
  },

  // ── Mixed / Alt ───────────────────────────────────────
  cereal_bowl_alt: {
    source: require('../../assets/environment/mess_assets_named/02_01_cereal_bowl_alt.png'),
    defaultWidth: 70, defaultHeight: 55, cleanType: 'blood', toughness: 1.0,
  },
  broken_toy_car: {
    source: require('../../assets/environment/mess_assets_named/02_02_broken_toy_car.png'),
    defaultWidth: 65, defaultHeight: 50, cleanType: 'furniture', toughness: 1.3,
  },
  dust_pile: {
    source: require('../../assets/environment/mess_assets_named/02_03_dust_pile.png'),
    defaultWidth: 75, defaultHeight: 55, cleanType: 'blood', toughness: 0.8,
  },
  dirty_socks: {
    source: require('../../assets/environment/mess_assets_named/02_04_dirty_socks.png'),
    defaultWidth: 60, defaultHeight: 45, cleanType: 'trash', toughness: 0.7,
  },
  chips_bag: {
    source: require('../../assets/environment/mess_assets_named/02_05_chips_bag.png'),
    defaultWidth: 65, defaultHeight: 50, cleanType: 'trash', toughness: 0.8,
  },
  blue_paint_spill: {
    source: require('../../assets/environment/mess_assets_named/02_06_blue_paint_spill_with_brush.png'),
    defaultWidth: 85, defaultHeight: 65, cleanType: 'blood', toughness: 1.5,
  },
  broken_glass_bottle: {
    source: require('../../assets/environment/mess_assets_named/02_07_broken_glass_bottle.png'),
    defaultWidth: 70, defaultHeight: 55, cleanType: 'glass', toughness: 1.3,
  },

  // ── Organic / Paper ───────────────────────────────────
  banana_peel: {
    source: require('../../assets/environment/mess_assets_named/03_01_banana_peel.png'),
    defaultWidth: 60, defaultHeight: 45, cleanType: 'trash', toughness: 0.6,
  },
  broken_wood_plank: {
    source: require('../../assets/environment/mess_assets_named/03_02_broken_wood_plank.png'),
    defaultWidth: 85, defaultHeight: 55, cleanType: 'furniture', toughness: 1.8,
  },
  spilled_soda_can: {
    source: require('../../assets/environment/mess_assets_named/03_03_spilled_soda_can.png'),
    defaultWidth: 70, defaultHeight: 55, cleanType: 'blood', toughness: 1.0,
  },
  crumpled_paper: {
    source: require('../../assets/environment/mess_assets_named/03_04_crumpled_paper.png'),
    defaultWidth: 55, defaultHeight: 45, cleanType: 'trash', toughness: 0.5,
  },
  broken_pen_pencil: {
    source: require('../../assets/environment/mess_assets_named/03_05_broken_pen_and_pencil.png'),
    defaultWidth: 65, defaultHeight: 45, cleanType: 'trash', toughness: 0.7,
  },
  tangled_earphones: {
    source: require('../../assets/environment/mess_assets_named/03_06_tangled_earphones.png'),
    defaultWidth: 65, defaultHeight: 50, cleanType: 'evidence', toughness: 1.0,
  },
  spilled_pet_food: {
    source: require('../../assets/environment/mess_assets_named/03_07_spilled_pet_food_bowl.png'),
    defaultWidth: 75, defaultHeight: 55, cleanType: 'blood', toughness: 1.0,
  },

  // ── Electronics / Industrial ──────────────────────────
  tangled_cable: {
    source: require('../../assets/environment/mess_assets_named/04_01_tangled_cable.png'),
    defaultWidth: 70, defaultHeight: 50, cleanType: 'evidence', toughness: 1.0,
  },
  pet_food_bowl: {
    source: require('../../assets/environment/mess_assets_named/04_02_pet_food_bowl.png'),
    defaultWidth: 65, defaultHeight: 50, cleanType: 'blood', toughness: 0.8,
  },
  stack_of_papers: {
    source: require('../../assets/environment/mess_assets_named/04_03_stack_of_papers.png'),
    defaultWidth: 70, defaultHeight: 55, cleanType: 'evidence', toughness: 1.2,
  },
  plastic_bottle: {
    source: require('../../assets/environment/mess_assets_named/04_04_plastic_bottle.png'),
    defaultWidth: 55, defaultHeight: 50, cleanType: 'trash', toughness: 0.7,
  },
  blue_paint_brush: {
    source: require('../../assets/environment/mess_assets_named/04_05_blue_paint_brush.png'),
    defaultWidth: 65, defaultHeight: 45, cleanType: 'evidence', toughness: 1.0,
  },
  broken_plate: {
    source: require('../../assets/environment/mess_assets_named/04_06_broken_plate.png'),
    defaultWidth: 70, defaultHeight: 55, cleanType: 'glass', toughness: 1.2,
  },
  work_boot: {
    source: require('../../assets/environment/mess_assets_named/04_07_work_boot.png'),
    defaultWidth: 70, defaultHeight: 55, cleanType: 'trash', toughness: 1.3,
  },

  // ── Heavy / Large ─────────────────────────────────────
  work_boot_alt: {
    source: require('../../assets/environment/mess_assets_named/05_01_work_boot_alt.png'),
    defaultWidth: 70, defaultHeight: 55, cleanType: 'trash', toughness: 1.3,
  },
  trash_bags: {
    source: require('../../assets/environment/mess_assets_named/05_02_trash_bags.png'),
    defaultWidth: 85, defaultHeight: 65, cleanType: 'trash', toughness: 1.5,
  },
  tipped_trash_can: {
    source: require('../../assets/environment/mess_assets_named/05_03_tipped_trash_can_spill.png'),
    defaultWidth: 90, defaultHeight: 70, cleanType: 'trash', toughness: 1.8,
  },
  spoon_on_food_spill: {
    source: require('../../assets/environment/mess_assets_named/05_04_spoon_on_food_spill.png'),
    defaultWidth: 75, defaultHeight: 55, cleanType: 'blood', toughness: 1.0,
  },
  cracked_smartphone: {
    source: require('../../assets/environment/mess_assets_named/05_05_cracked_smartphone.png'),
    defaultWidth: 55, defaultHeight: 50, cleanType: 'evidence', toughness: 1.5,
  },
  spilled_candy: {
    source: require('../../assets/environment/mess_assets_named/05_06_spilled_candy.png'),
    defaultWidth: 75, defaultHeight: 55, cleanType: 'trash', toughness: 0.8,
  },
  knocked_over_plant: {
    source: require('../../assets/environment/mess_assets_named/05_07_knocked_over_plant_pot.png'),
    defaultWidth: 80, defaultHeight: 65, cleanType: 'furniture', toughness: 1.3,
  },
};
/* eslint-enable @typescript-eslint/no-require-imports */

export function getMessSprite(id: MessSpriteId): MessSpriteInfo {
  return MESS_SPRITES[id];
}
