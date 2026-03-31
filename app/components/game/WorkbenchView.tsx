// app/components/game/WorkbenchView.tsx
"use client";

import { useState } from "react";
import { Hammer, Package, User, X, ChevronRight } from "lucide-react";
import { useCountdown } from "../../hooks/game/useCountdown";
import { useLabor } from "../../hooks/game/useLabor";
import { RECIPES } from "../../types/Recipes";
import { DEV_USER_ID } from "@/lib/devUser";
import { getLaborTotalDurationSeconds } from "@/lib/game/labor";
import { getItemDisplayName } from "@/app/types/Items";
import { formatDurationHMS } from "@/lib/game/formatTime";

type WorkbenchViewProps = {
  units: any[];
  resources: any;
  inventory: any[];
  refresh: (silent?: boolean) => void;
  /** マップから遷移したときの施設絞り込み */
  entry?: "workbench" | "grit" | null;
};

export default function WorkbenchView({
  units,
  resources,
  inventory,
  refresh,
  entry = null,
}: WorkbenchViewProps) {
  const userId = DEV_USER_ID;
  const { startLabor } = useLabor(userId, resources, inventory, refresh);

  const [step, setStep] = useState<'select_recipe' | 'configure'>('select_recipe');
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [craftCount, setCraftCount] = useState(1);

  const laborUnit = units.find(u => u.status === 'labor');
  const activeRecipe = RECIPES.find(r => String(r.id) === String(laborUnit?.mission_id));
  const laborTotalSeconds =
    activeRecipe != null
      ? getLaborTotalDurationSeconds(activeRecipe.duration, laborUnit?.labor_quantity)
      : 0;

  // 💡 カウントダウン（所要時間 = レシピ1個分 × labor_quantity）
  const timeLeft = useCountdown(laborUnit?.mission_started_at, laborTotalSeconds);

  const stockOf = (inputItemId: string) =>
    inventory.find((i) => i.item_id === inputItemId)?.amount ?? 0;

  const maxCraftCount = (recipe: any) => {
    const limits: number[] = [];
    const hasInput = !!recipe.inputItemId && (recipe.inputAmount || 0) > 0;
    if (hasInput) {
      limits.push(Math.floor(stockOf(recipe.inputItemId) / (recipe.inputAmount || 1)));
    }
    if ((recipe.costWater || 0) > 0) {
      limits.push(Math.floor(stockOf("water") / recipe.costWater));
    }
    if ((recipe.costFood || 0) > 0) {
      limits.push(Math.floor(stockOf("food") / recipe.costFood));
    }
    if ((recipe.costGrit || 0) > 0) {
      limits.push(Math.floor((resources?.grit || 0) / recipe.costGrit));
    }
    if (limits.length === 0) return 1;
    return Math.max(0, Math.min(...limits));
  };

  const costLabel = (recipe: any) => {
    const parts: string[] = [];
    if ((recipe.costWater || 0) > 0) parts.push(`水${recipe.costWater}`);
    if ((recipe.costFood || 0) > 0) parts.push(`食料${recipe.costFood}`);
    if ((recipe.costGrit || 0) > 0) parts.push(`${recipe.costGrit} Grit`);
    return parts.length > 0 ? parts.join(" ・ ") : "コストなし";
  };

  const recipePool = entry ? RECIPES.filter((r) => r.station === entry) : RECIPES;

  /** 材料を1個以上持っているレシピだけ一覧に出す */
  const craftableRecipes = recipePool.filter((r) => maxCraftCount(r) > 0);

  const targetRecipe = RECIPES.find(
    (r) => String(r.id) === String(selectedRecipeId)
  );

  const openConfigure = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    setStep('configure');
    setCraftCount(1);
  };

  const handleStart = async () => {
    if (!selectedRecipeId || !selectedUnitId) return;
    const success = await startLabor(selectedRecipeId, selectedUnitId, craftCount);
    if (success) {
      setStep('select_recipe');
      setSelectedRecipeId(null);
      setSelectedUnitId(null);
    }
  };

  return (
    <div className="p-4 bg-slate-950/50 min-h-full">
      <h2
        className={`text-xl font-black flex items-center gap-2 ${
          entry === "grit" ? "text-amber-400" : "text-blue-400"
        }`}
      >
        <Hammer size={20} />
        {entry === "grit" ? "G.R.I.T" : "工作台"}
      </h2>
      {entry === "grit" && (
        <p className="text-[10px] text-amber-400/90 mb-6 mt-1">浄水生成・食料合成</p>
      )}
      {entry === "workbench" && (
        <p className="text-[10px] text-blue-300/80 mb-6 mt-1">低級スクラップの分解</p>
      )}
      {!entry && <div className="mb-6" />}

      {/* 📡 3. 追加：作業中の進捗表示エリア */}
      {laborUnit && (
        <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl animate-in fade-in slide-in-from-top-2">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Now Processing</span>
            <span className="text-xs font-mono font-black text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded">
              {formatDurationHMS(timeLeft)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
              <User size={16}/>
            </div>
            <div>
              <div className="text-sm font-bold text-white">{activeRecipe?.name}</div>
              <div className="text-[10px] text-slate-400">{laborUnit.master_id} が作業中...</div>
            </div>
          </div>
          {/* 簡易プログレスバー */}
          <div className="mt-3 w-full h-1 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
              style={{ width: `${(timeLeft / (laborTotalSeconds || 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {step === 'select_recipe' ? (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">行う作業を選んでね</p>
          {craftableRecipes.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl text-slate-600 text-sm">
              材料を持っていないよ
            </div>
          ) : (
            craftableRecipes.map((recipe) => (
              <button
                key={recipe.id}
                type="button"
                onClick={() => openConfigure(recipe.id)}
                className="w-full bg-slate-900 border border-white/5 p-4 rounded-2xl flex items-center justify-between hover:bg-slate-800 transition-all text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 shrink-0 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-400">
                    <Package size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white truncate">{recipe.name}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      1個あたり {formatDurationHMS(recipe.duration)} ・ {costLabel(recipe)}
                    </div>
                    <div className="text-[10px] text-slate-600 mt-0.5">
                      {recipe.inputItemId
                        ? `必要: ${getItemDisplayName(recipe.inputItemId)} / 所持: ${stockOf(recipe.inputItemId)}`
                        : "必要素材なし"}
                    </div>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-600 shrink-0" />
              </button>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <button
            type="button"
            onClick={() => setStep('select_recipe')}
            className="text-xs text-slate-500 flex items-center gap-1"
          >
            <X size={12} /> 戻る
          </button>

          <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-2xl">
            <h3 className="font-bold text-blue-400">{targetRecipe?.name}</h3>
            <p className="text-[10px] text-blue-300/70">
              1個あたり {formatDurationHMS(targetRecipe?.duration || 0)} / {targetRecipe ? costLabel(targetRecipe) : "-"}
            </p>
          </div>

          {/* 個数選択 */}
          <div>
            <label className="text-xs font-bold text-slate-400 mb-2 block">作業個数: {craftCount}個</label>
            <input 
              type="range" min="1" 
              max={Math.max(1, targetRecipe ? maxCraftCount(targetRecipe) : 1)} 
              value={craftCount}
              onChange={(e) => setCraftCount(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* ユニット選択 */}
          <div>
            <label className="text-xs font-bold text-slate-400 mb-2 block flex items-center gap-1">
              <User size={12}/> 担当者を選択
            </label>
            <div className="grid grid-cols-3 gap-2">
              {units.map((u) => (
                <button
                  key={u.id}
                  disabled={u.status !== 'idle'}
                  onClick={() => setSelectedUnitId(u.id)}
                  className={`p-2 rounded-xl border-2 text-[10px] font-bold transition-all ${
                    selectedUnitId === u.id 
                      ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                      : u.status !== 'idle' ? 'opacity-20 grayscale cursor-not-allowed' : 'border-white/5 bg-slate-900 text-slate-500'
                  }`}
                >
                  {u.master_id}
                </button>
              ))}
            </div>
          </div>

          <button
            disabled={!selectedUnitId}
            onClick={handleStart}
            className={`w-full py-4 rounded-2xl font-black transition-all ${
              selectedUnitId ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-800 text-slate-600'
            }`}
          >
            作業開始 ({targetRecipe ? `${costLabel({
              costWater: (targetRecipe.costWater || 0) * craftCount,
              costFood: (targetRecipe.costFood || 0) * craftCount,
              costGrit: (targetRecipe.costGrit || 0) * craftCount,
            })}` : "-"})
          </button>
        </div>
      )}
    </div>
  );
}