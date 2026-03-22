import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase'; 
import { UserUnit, UserInventory, MasterData, Stats } from '@/app/types/game1';
import { MISSIONS, Mission } from "@/app/types/ExplorationMission";

export function useGameData() {
  const [units, setUnits] = useState<UserUnit[]>([]);
  const [inventory, setInventory] = useState<UserInventory[]>([]);
  const [masterData, setMasterData] = useState<Record<string, MasterData>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [resources, setResources] = useState({
    electric_power: 120, food: 450, water: 300,
    population: { current: 12, total: 15 },
    minerals: 80 
  });

  // ✅ 修正ポイント1: 引数 silent を追加して、画面を止めずに裏で更新できるようにする
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true); 
    try {
      const [masterRes, unitsRes, invRes, resRes] = await Promise.all([
        supabase.from('game_master_data').select('*'),
        supabase.from('game_units').select('*'),
        supabase.from('game_inventory').select('*'),
        // 406エラー対策で .single() ではなく .maybeSingle() にし、user_id で絞り込む
        supabase.from('game_resources').select('*').eq('user_id', 'test-user').maybeSingle() 
      ]);

      const masterMap: Record<string, MasterData> = {};
      masterRes.data?.forEach((m: MasterData) => {
        masterMap[m.id] = m;
      });

      setMasterData(masterMap);
      setUnits(unitsRes.data || []);
      setInventory(invRes.data || []);
      
      if (resRes.data) {
        setResources(prev => ({
          ...prev,
          ...resRes.data,
          population: resRes.data.population || prev.population 
        }));
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(); // 初回だけは画面を止めて取得
  }, [fetchData]);

  const getFinalStats = (unit: UserUnit): Stats => {
    const master = masterData[unit.master_id];
    if (!master || !master.base_stats) return { hp: 0, vit: 0, cap: 0, int: 0, edu: 0 };
    
    const final = { ...master.base_stats };
    unit.equipped_item_ids?.forEach(itemId => {
      const itemMaster = masterData[itemId];
      if (itemMaster?.bonus_stats) {
        final.hp += itemMaster.bonus_stats.hp || 0;
        final.vit += itemMaster.bonus_stats.vit || 0;
        final.cap += itemMaster.bonus_stats.cap || 0;
        final.int += itemMaster.bonus_stats.int || 0;
        final.edu += itemMaster.bonus_stats.edu || 0;
      }
    });
    return final;
  };

  // ✅ 修正ポイント2: 更新後は silent: true で fetchData を呼ぶ
  const startMission = async (unitId: string, missionId: string) => {
    const { error } = await supabase
      .from('game_units')
      .update({ 
        status: 'mission', 
        mission_id: missionId, 
        mission_started_at: new Date().toISOString() 
      })
      .eq('id', unitId);
    
    if (!error) {
      await fetchData(true); // 👈 ここ！ silent にして画面を消さない
    } else {
      console.error("Start Mission DB Error:", error);
    }
  };

  const completeMission = async (unitId: string, mission: Mission) => {
    // 最新の units を使って判定するために、関数型アップデートに近い考え方をするけど
    // ここではまず確実に unit を特定する
    const unit = units.find(u => u.id === unitId);
    if (!unit) {
      console.error("完了対象のユニットが見つかりません:", unitId);
      return;
    }
    
    // ... 判定ロジック ...
    const stats = getFinalStats(unit);
    const bonus = (stats[mission.requiredStat] || 0) * 0.1;
    const successRate = Math.min(99, mission.baseSurvivalRate + bonus);
    const isSuccess = Math.random() * 100 <= successRate;

    if (isSuccess) {
      const rewardFood = mission.reward.food || 0;
      const rewardMinerals = mission.reward.minerals || 0;

      // ✅ 修正ポイント3: リソース計算に resources 直接ではなく prev を使う（安全策）
      setResources(prev => {
        const next = {
          ...prev,
          food: prev.food + rewardFood,
          minerals: prev.minerals + rewardMinerals
        };

        // DB更新（副作用だけど、ここで計算後の値を使う）
        supabase.from('game_resources').update({
          food: next.food,
          minerals: next.minerals,
          updated_at: new Date().toISOString()
        }).eq('user_id', 'test-user').then();

        return next;
      });

      await supabase.from('game_units').update({ 
        status: 'idle', mission_id: null, mission_started_at: null,
        level: unit.level + (mission.reward.exp > 10 ? 1 : 0)
      }).eq('id', unitId);

      alert(`${masterData[unit.master_id]?.name} が帰還！`);
    } else {
      await supabase.from('game_units').update({ 
        status: 'idle', mission_id: null, mission_started_at: null 
      }).eq('id', unitId);
      alert('任務失敗。');
    }
    await fetchData(true); // 👈 ここも silent!
  };

  return { units, inventory, masterData, resources, isLoading, getFinalStats, refresh: fetchData, startMission, completeMission };
}