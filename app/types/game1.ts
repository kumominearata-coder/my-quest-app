// ステータスの基本形
export type Stats = {
  hp: number;
  vit: number;
  cap: number;
  int: number;
  edu: number;
};

// 図鑑データ（game_master_data テーブルに対応）
export type MasterData = {
  id: string;           // 'unit_shojo_01' や 'item_knife_01'
  category: 'unit' | 'item';
  name: string;
  description: string;
  base_stats?: Stats;   // キャラクターの基本能力
  bonus_stats?: Stats;  // 装備品の加算能力
};

// おにい自身の所持キャラ（game_units テーブルに対応）
export type UserUnit = {
  id: string;                // 自動で割り振られたUUID
  master_id: string;         // 'unit_shojo_01'
  level: number;
  exp: number;
  equipped_item_ids: string[]; // 装備中の「マスターID」の配列
  status: 'idle' | 'mission'; // 探査の出撃状態
  mission_id: string | null;   // 実行中の任務ID
  mission_started_at: string | null; // 開始時刻（ISO文字列）
};

// おにい自身の所持アイテム（game_inventory テーブルに対応）
export type UserInventory = {
  id: string;        // 自動で割り振られたUUID
  item_id: string;   // 'item_knife_01'
  quantity: number;
};