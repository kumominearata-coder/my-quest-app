// hooks/game/useLabor.ts
import { useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { RECIPES } from "../../types/Recipes";

export const useLabor = (userId: string, resources: any, inventory: any[], refresh: (silent?: boolean) => void) => {
  const completingUnitsRef = useRef<Set<string>>(new Set());
  const getStock = (itemId?: string) =>
    itemId ? inventory.find((i) => i.item_id === itemId)?.amount || 0 : 0;
  
  const startLabor = async (recipeId: string, unitId: string, count: number) => {
    const recipe = RECIPES.find(r => String(r.id) === String(recipeId));
    if (!recipe) return false;

    const totalGrit = (recipe.costGrit || 0) * count;
    const totalWater = (recipe.costWater || 0) * count;
    const totalFood = (recipe.costFood || 0) * count;
    const inputAmount = (recipe.inputAmount || 0) * count;
    const itemInStock = getStock(recipe.inputItemId);

    // バリデーション
    if (
      (totalGrit > 0 && (resources?.grit || 0) < totalGrit) ||
      (totalWater > 0 && getStock("water") < totalWater) ||
      (totalFood > 0 && getStock("food") < totalFood) ||
      (inputAmount > 0 && itemInStock < inputAmount)
    ) {
      return false;
    }

    const consumed: { itemId: string; amount: number }[] = [];
    const consumeItem = async (itemId: string, amount: number) => {
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
    const rollbackConsumedItems = async () => {
      for (const c of consumed) {
        await supabase.rpc("increment_inventory", {
          p_user_id: userId,
          p_item_id: c.itemId,
          p_amount: c.amount,
        });
      }
    };

    // 1. コスト消費
    if (totalGrit > 0) {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ grit: resources.grit - totalGrit })
        .eq("id", userId);
      if (profileError) {
        console.error("🚨 useLabor.startLabor: grit更新失敗", profileError);
        return false;
      }
    }
    if (!(await consumeItem("water", totalWater))) {
      await supabase.from("profiles").update({ grit: resources.grit }).eq("id", userId);
      return false;
    }
    if (!(await consumeItem("food", totalFood))) {
      await rollbackConsumedItems();
      await supabase.from("profiles").update({ grit: resources.grit }).eq("id", userId);
      return false;
    }
    if (recipe.inputItemId && inputAmount > 0 && !(await consumeItem(recipe.inputItemId, inputAmount))) {
      await rollbackConsumedItems();
      await supabase.from("profiles").update({ grit: resources.grit }).eq("id", userId);
      return false;
    }

    // 2. ユニットを作業状態に（所要時間は recipe.duration × labor_quantity）
    const { error: unitError } = await supabase.from('game_unit').update({
      status: 'labor',
      mission_id: recipe.id,
      mission_started_at: new Date().toISOString(),
      labor_quantity: count,
    }).eq('id', unitId);
    if (unitError) {
      console.error("🚨 useLabor.startLabor: ユニット更新失敗", unitError);
      if (unitError.code === 'PGRST204') {
        console.error(
          "→ game_unit に labor_quantity 列がありません。Supabase の SQL Editor で scripts/add-labor-quantity.sql を実行してください。"
        );
      }
      await rollbackConsumedItems();
      await supabase.from("profiles").update({ grit: resources.grit }).eq("id", userId);
      return false;
    }

    await refresh(true);
    return true;
  };

  const completeLabor = useCallback(async (unit: any) => {
    if (!unit || unit.status !== 'labor') return;
    if (completingUnitsRef.current.has(unit.id)) return;
    completingUnitsRef.current.add(unit.id);
    
    try {
      // 💡 String化して確実にレシピを見つける！
      const recipe = RECIPES.find(r => String(r.id) === String(unit.mission_id));
      const qty = Math.max(1, unit.labor_quantity ?? 1);
      if (!recipe) {
        console.error("🚨 useLabor.completeLabor: レシピが見つかりません ID:", unit.mission_id);
      } else {
        console.log("🛠️ 労働完了：処理を開始します...");

        // 報酬付与（個数分スケール。失敗してもユニット解放は継続）
        for (const reward of recipe.outputs) {
          if (Math.random() <= reward.chance) {
            const base = Math.floor(Math.random() * (reward.max - reward.min + 1)) + reward.min;
            const amount = base * qty;
            if (amount > 0) {
              const { error: rewardError } = await supabase.rpc('increment_inventory', {
                p_user_id: userId, p_item_id: reward.itemId, p_amount: amount
              });
              if (rewardError) {
                console.error("🚨 useLabor.completeLabor: 報酬付与失敗", {
                  itemId: reward.itemId,
                  amount,
                  rewardError
                });
              }
            }
          }
        }
      }

      // 最後に解放（ここは必ず試行）
      const { error: releaseError } = await supabase.from('game_unit').update({
        status: 'idle',
        mission_id: null,
        mission_started_at: null,
        labor_quantity: null,
      }).eq('id', unit.id);

      if (releaseError) {
        console.error("🚨 useLabor.completeLabor: ユニット解放失敗", releaseError);
        return;
      }

      console.log("✅ ユニットを解放しました。");
      await refresh(true);
    } finally {
      completingUnitsRef.current.delete(unit.id);
    }
  }, [userId, refresh]); // 依存関係を固定

  return { startLabor, completeLabor };
};