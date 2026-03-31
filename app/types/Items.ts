// app/types/Items.ts
export type ItemId =
  | "water" | "food" 
  | "low_scrap"
  | "iron_scrap" | "copper_scrap" | "waste_rubber" | "waste_oil" | "waste_glass"
  | "timber"
  | "fe_plate" | "fe_rod" | "cu_plate" | "cu_rod";

export const ITEM_DISPLAY_NAMES: Record<ItemId, string> = {
  water: "水",
  food: "食料",
  low_scrap: "低級スクラップ",
  iron_scrap: "鉄くず",
  copper_scrap: "銅くず",
  waste_rubber: "廃ゴム",
  waste_oil: "廃油",
  waste_glass: "廃ガラス",
  timber: "木材",
  fe_plate: "Fe板材",
  fe_rod: "Feロッド材",
  cu_plate: "Cu板材",
  cu_rod: "Cuロッド材",
};

export function getItemDisplayName(itemId: string): string {
  return (ITEM_DISPLAY_NAMES as Record<string, string>)[itemId] ?? itemId;
}