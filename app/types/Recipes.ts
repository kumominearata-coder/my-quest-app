// app/types/Recipes.ts
import type { ItemId } from "./Items";

export interface Recipe {
  id: string;
  name: string;
  station: "workbench" | "grit";
  inputItemId?: ItemId;
  inputAmount?: number;
  costGrit?: number;
  costWater?: number;
  costFood?: number;
  duration: number; // 加工にかかる秒数
  outputs: {
    itemId: ItemId;
    min: number;
    max: number;
    chance: number;    // 出現率（0.0〜1.0）
  }[];
}

export const RECIPES: Recipe[] = [
  {
    id: 'scrap-dismantle',
    name: '低級スクラップの分解',
    station: "workbench",
    inputItemId: 'low_scrap',
    inputAmount: 1,
    costWater: 3,
    costFood: 1,
    duration: 1200, // 20 分
    outputs: [
      { itemId: 'iron_scrap', min: 1, max: 2, chance: 1.0 },
      { itemId: 'copper_scrap', min: 1, max: 1, chance: 0.3 },
      { itemId: 'waste_rubber', min: 1, max: 1, chance: 0.3 },
      { itemId: 'waste_oil', min: 1, max: 1, chance: 0.9 },
      { itemId: 'waste_glass', min: 1, max: 1, chance: 0.2 },
    ]
  },
  {
    id: "water-refill",
    name: "浄水生成",
    station: "grit",
    costGrit: 10,
    duration: 600, // 10 分
    outputs: [{ itemId: "water", min: 1, max: 1, chance: 1.0 }],
  },
  {
    id: "food-ration",
    name: "食料合成",
    station: "grit",
    costGrit: 20,
    duration: 3600, // 1 時間
    outputs: [{ itemId: "food", min: 1, max: 1, chance: 1.0 }],
  }
];