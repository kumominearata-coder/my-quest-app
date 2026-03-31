"use client";

import { useEffect, useMemo, useState } from "react";
import { Users2, X, User, Hammer, Navigation } from "lucide-react";
import { MISSIONS } from "../../types/ExplorationMission";
import { RECIPES } from "../../types/Recipes";
import { getLaborTotalDurationSeconds } from "@/lib/game/labor";
import { formatDurationHMS } from "@/lib/game/formatTime";

type UnitListViewProps = {
  units: any[];
};

function getUnitWorkInfo(unit: any, nowMs: number) {
  if (unit.status === "idle" || !unit.mission_started_at) {
    return { label: "待機中", remaining: 0, duration: 0, targetName: "-" };
  }

  const startedAt = new Date(unit.mission_started_at).getTime();
  const elapsed = Math.max(0, Math.floor((nowMs - startedAt) / 1000));

  if (unit.status === "mission") {
    const mission = MISSIONS.find((m) => String(m.id) === String(unit.mission_id));
    const duration = mission?.duration ?? 0;
    return {
      label: "探査中",
      remaining: Math.max(0, duration - elapsed),
      duration,
      targetName: mission?.name ?? "不明な任務",
    };
  }

  if (unit.status === "labor") {
    const recipe = RECIPES.find((r) => String(r.id) === String(unit.mission_id));
    const duration = recipe
      ? getLaborTotalDurationSeconds(recipe.duration, unit.labor_quantity)
      : 0;
    return {
      label: "作業中",
      remaining: Math.max(0, duration - elapsed),
      duration,
      targetName: recipe?.name ?? "不明なレシピ",
    };
  }

  const asMission = MISSIONS.find((m) => String(m.id) === String(unit.mission_id));
  if (asMission) {
    return { label: "探査中", remaining: 0, duration: asMission.duration, targetName: asMission.name };
  }

  const asLaborRecipe = RECIPES.find((r) => String(r.id) === String(unit.mission_id));
  if (asLaborRecipe) {
    return {
      label: "作業中",
      remaining: 0,
      duration: getLaborTotalDurationSeconds(asLaborRecipe.duration, unit.labor_quantity),
      targetName: asLaborRecipe.name,
    };
  }

  return { label: unit.status, remaining: 0, duration: 0, targetName: "-" };
}

export default function UnitListView({ units }: UnitListViewProps) {
  const [selectedUnit, setSelectedUnit] = useState<any | null>(null);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const unitCards = useMemo(
    () =>
      units.map((unit) => ({
        unit,
        info: getUnitWorkInfo(unit, nowMs),
      })),
    [units, nowMs]
  );

  return (
    <div className="p-4 bg-slate-950/50 min-h-full">
      <h2 className="text-xl font-black mb-6 text-cyan-400 flex items-center gap-2">
        <Users2 size={20} /> ユニット
      </h2>

      {unitCards.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl text-slate-600 text-sm">
          ユニットがいないよ
        </div>
      ) : (
        <div className="space-y-3">
          {unitCards.map(({ unit, info }) => (
            <button
              key={unit.id}
              type="button"
              onClick={() => setSelectedUnit(unit)}
              className="w-full bg-slate-900 border border-white/5 p-4 rounded-2xl hover:bg-slate-800 transition-all text-left"
            >
              <div className="flex justify-between items-start gap-3">
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <User size={14} className="text-cyan-400" />
                    {unit.master_id}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    状態: {info.label}
                  </div>
                  {unit.status !== "idle" && (
                    <div className="text-[10px] text-slate-400 mt-1">
                      内容: {info.targetName}
                    </div>
                  )}
                </div>
                {unit.status !== "idle" && (
                  <div className="text-right">
                    <div className="text-xs font-mono font-black text-cyan-400">
                      {formatDurationHMS(info.remaining)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      / {formatDurationHMS(info.duration)}
                    </div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedUnit && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-black text-white">ユニット詳細</h3>
              <button
                type="button"
                onClick={() => setSelectedUnit(null)}
                className="text-slate-500 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="text-slate-300">
                名前: <span className="font-bold text-white">{selectedUnit.master_id}</span>
              </div>
              <div className="text-slate-300">
                状態: {getUnitWorkInfo(selectedUnit, nowMs).label}
              </div>
              <div className="text-slate-300">ID: {selectedUnit.id}</div>
              {selectedUnit.status === "mission" && (
                <div className="text-amber-400 text-xs flex items-center gap-1">
                  <Navigation size={12} /> 探査任務を実行中
                </div>
              )}
              {selectedUnit.status === "labor" && (
                <div className="text-blue-400 text-xs flex items-center gap-1">
                  <Hammer size={12} /> 工作作業を実行中
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
