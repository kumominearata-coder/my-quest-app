export type ItemId = 
  | "low_scrap" 
  | "iron_scrap" | "copper_scrap" | "waste_rubber" | "waste_oil" | "waste_glass" 
  | "fe_plate" | "fe_rod" | "cu_plate" | "cu_rod";

export type Recipe = {
  id: string;
  name: string;
  input: { itemId: ItemId; amount: number };
  output: { itemId: ItemId; amount: number };
  duration: number; // 加工にかかる秒数
};

export const CRAFT_RECIPES: Record<string, Recipe> = {
  iron_to_plate: {
    id: "iron_to_plate",
    name: "Fe板材加工",
    input: { itemId: "iron_scrap", amount: 1 },
    output: { itemId: "fe_plate", amount: 1 },
    duration: 10, // とりあえず10秒
  },
  iron_to_rod: {
    id: "iron_to_rod",
    name: "Feロッド材加工",
    input: { itemId: "iron_scrap", amount: 1 },
    output: { itemId: "fe_rod", amount: 1 },
    duration: 15,
  },
};