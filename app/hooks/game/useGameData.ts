import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // おにい、自分の設定に合わせてね
import { UserUnit, UserInventory, MasterData, Stats } from '@/app/types/game1';

export function useGameData() {
  const [units, setUnits] = useState<UserUnit[]>([]);
  const [inventory, setInventory] = useState<UserInventory[]>([]);
  const [masterData, setMasterData] = useState<Record<string, MasterData>>({});
  const [isLoading, setIsLoading] = useState(true);

  // 1. データを全部持ってくる
  const fetchData = async () => {
    setIsLoading(true);

    // マスターデータ、所持ユニット、所持アイテムを並列で取得
    const [masterRes, unitsRes, invRes] = await Promise.all([
      supabase.from('game_master_data').select('*'),
      supabase.from('game_units').select('*'),
      supabase.from('game_inventory').select('*')
    ]);

    // マスターデータはIDで引きやすいように辞書形式（Record）に変換
    const masterMap: Record<string, MasterData> = {};
    masterRes.data?.forEach((m: MasterData) => {
      masterMap[m.id] = m;
    });

    setMasterData(masterMap);
    setUnits(unitsRes.data || []);
    setInventory(invRes.data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 2. おにいのこだわりの「最終ステータス計算」ロジック
  const getFinalStats = (unit: UserUnit): Stats => {
    const master = masterData[unit.master_id];
    if (!master || !master.base_stats) return { hp: 0, vit: 0, cap:0, int: 0, edu: 0 };

    const final = { ...master.base_stats };

    // 装備中のIDをループしてボーナスを加算
    unit.equipped_item_ids.forEach(itemId => {
      const itemMaster = masterData[itemId];
      if (itemMaster?.bonus_stats) {
        final.hp += itemMaster.bonus_stats.hp || 0  
        final.vit += itemMaster.bonus_stats.vit || 0;
        final.cap += itemMaster.bonus_stats.cap || 0;
        final.int += itemMaster.bonus_stats.int || 0;
        final.edu += itemMaster.bonus_stats.edu || 0;
      }
    });

    return final;
  };

  return { units, inventory, masterData, isLoading, getFinalStats, refresh: fetchData };
}