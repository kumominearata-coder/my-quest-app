// app/types/ExplorationMission.ts

export interface Mission {
  id: string;
  name: string;
  description: string;
  duration: number; // 秒単位
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  baseSurvivalRate: number; // 基礎生存率 (%)
  requiredStat: 'vit' | 'int' | 'edu'; // 成功に影響する主ステータス
  reward: {
    food?: number;
    water?: number;
    minerals?: number;
    grit?: number;
    exp: number;
  };
}

export const MISSIONS: Mission[] = [
  {
    id: 'patrol-1',
    name: '周辺哨戒',
    description: '基地の周りに異常がないか確認する。比較的安全な任務。',
    duration: 28800, // 8時間
    risk: 'LOW',
    baseSurvivalRate: 100,
    requiredStat: 'vit',
    reward: { food: 10, water: 5, minerals: 5, exp: 5 }
  },
  {
    id: 'scavenge-1',
    name: '廃ビル探索',
    description: '近くの廃ビルで物資を調達する。少し危険が伴う。',
    duration: 1200, // 20分
    risk: 'MEDIUM',
    baseSurvivalRate: 80,
    requiredStat: 'int',
    reward: { food: 30, grit: 5, exp: 15 }
  }
];