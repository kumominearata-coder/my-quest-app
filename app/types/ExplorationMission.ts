// app/types/ExplorationMission.ts

export type RewardItem = {
  itemId: string;
  min: number;
  max: number;
};

export interface Mission {
  id: string;
  name: string;
  description: string;
  duration: number; // 秒単位
  costWater: number;
  costFood: number;
  rewards: RewardItem[];
}

export const MISSIONS: Mission[] = [
  {
    id: 'scavenge-1',
    name: '廃墟の探索',
    description: '近くの廃墟を探検し、使えそうな物資を探す。',
    duration: 3600, // 1時間
    costWater: 1,
    costFood: 1,
    rewards: [{ itemId: "low_scrap", min: 1, max: 3 }],
  },
  {
    id: 'scavenge-2',
    name: '山林探索',
    description: '近くの山林で木材を調達する。',
    duration: 7200, // 2時間
    costWater: 1,
    costFood: 1,
    rewards: [{ itemId: "timber", min: 1, max: 1 }]
  },
]
