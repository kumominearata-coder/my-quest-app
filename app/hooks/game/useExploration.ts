// hooks/game/useExploration.ts
import { supabase } from "@/lib/supabase";
import { MISSIONS } from "../../types/ExplorationMission";

export const useExploration = (userId: string, inventory: any[], refresh: (silent?: boolean) => void) => {
  
  // 探査開始
  const startMission = async (missionId: string, unitId: string) => {
    const targetMission = MISSIONS.find(m => String(m.id) === String(missionId));
    if (!targetMission) return;

    const waterStock = inventory.find(i => i.item_id === "water")?.amount || 0;
    const foodStock = inventory.find(i => i.item_id === "food")?.amount || 0;
    if (waterStock < targetMission.costWater || foodStock < targetMission.costFood) {
      alert(`水か食料が足りないよ。水:${targetMission.costWater} / 食料:${targetMission.costFood} 必要だよ。`);
      return false;
    }

    // 1. 水・食料を消費
    const consumed: { itemId: string; amount: number }[] = [];
    const consume = async (itemId: string, amount: number) => {
      if (amount <= 0) return true;
      const { error } = await supabase.rpc("increment_inventory", {
        p_user_id: userId,
        p_item_id: itemId,
        p_amount: -amount,
      });
      if (error) return false;
      consumed.push({ itemId, amount });
      return true;
    };
    const rollback = async () => {
      for (const c of consumed) {
        await supabase.rpc("increment_inventory", {
          p_user_id: userId,
          p_item_id: c.itemId,
          p_amount: c.amount,
        });
      }
    };

    if (!(await consume("water", targetMission.costWater))) return false;
    if (!(await consume("food", targetMission.costFood))) {
      await rollback();
      return false;
    }

    // 2. ユニット派遣
    const { error: uError } = await supabase.from('game_unit').update({
      status: 'mission',
      mission_id: missionId,
      mission_started_at: new Date().toISOString(),
      labor_quantity: null,
    }).eq('id', unitId);
    if (uError) {
      await rollback();
      return false;
    }

    refresh(true);
    return true;
  };

  // 探査完了
  const completeMission = async (unit: any) => {
    if (!unit || unit.status !== 'mission') return;
    const mission = MISSIONS.find(m => m.id === unit.mission_id);
    if (!mission) return;

    // 報酬計算と付与
    for (const reward of mission.rewards) {
      const amount = Math.floor(Math.random() * (reward.max - reward.min + 1)) + reward.min;
      await supabase.rpc('increment_inventory', {
        p_user_id: userId, p_item_id: reward.itemId, p_amount: amount
      });
    }

    // ユニット解放
    await supabase.from('game_unit').update({
      status: 'idle',
      mission_id: null,
      mission_started_at: null,
      labor_quantity: null,
    }).eq('id', unit.id);

    refresh(true);
  };

  return { startMission, completeMission };
};