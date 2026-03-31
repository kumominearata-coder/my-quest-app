// app/components/game/GameHub.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react"; 
import { useGameTime } from "../../hooks/game/useGameTime";
import { useGameData } from "../../hooks/game/useGameData";
import { useExploration } from "../../hooks/game/useExploration";
import { useLabor } from "../../hooks/game/useLabor";
import { MISSIONS } from "../../types/ExplorationMission";
import { RECIPES } from "../../types/Recipes";
import InventoryView from "./InventoryView";
import ExplorationView from "./ExplorationView";
import WorkbenchView from "./WorkbenchView";
import UnitListView from "./UnitListView";
import GameMapView from "./GameMapView";
import { Zap, Utensils, Users, Box, Navigation, Users2, Settings, X, Hammer } from "lucide-react";
import { DEV_USER_ID } from "@/lib/devUser";
import { getLaborTotalDurationSeconds } from "@/lib/game/labor";

export default function GameHub({ grit, onBack }: { grit: number; onBack: () => void }) {
  const { resources, isLoading, units, inventory, refresh } = useGameData();
  const userId = DEV_USER_ID;

  // 完了処理の道具を準備
  const { completeMission } = useExploration(userId, inventory, refresh);
  const { completeLabor } = useLabor(userId, resources, inventory, refresh);

  const isProcessingRef = useRef(false);

  const processUnitCompletions = useCallback(async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    try {
      for (const unit of units) {
        if (unit.status === 'idle' || !unit.mission_started_at) continue;

        const now = new Date().getTime();
        const startTime = new Date(unit.mission_started_at).getTime();

        let duration = 0;
        if (unit.status === 'mission') {
          duration = MISSIONS.find(m => String(m.id) === String(unit.mission_id))?.duration || 0;
        } else if (unit.status === 'labor') {
          const recipe = RECIPES.find(r => String(r.id) === String(unit.mission_id));
          duration = recipe
            ? getLaborTotalDurationSeconds(recipe.duration, unit.labor_quantity)
            : 0;
          if (duration <= 0) {
            await completeLabor(unit);
            continue;
          }
        }
        if (duration <= 0) continue;

        const elapsed = Math.floor((now - startTime) / 1000);
        if (elapsed >= duration) {
          if (unit.status === 'mission') await completeMission(unit);
          if (unit.status === 'labor') await completeLabor(unit);
        }
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [units, completeMission, completeLabor]);

  useEffect(() => {
    void processUnitCompletions();
    const timer = setInterval(() => {
      void processUnitCompletions();
    }, 1000);
    return () => clearInterval(timer);
  }, [processUnitCompletions]);
  
  // useGameTime から「季節・日数」「24時間表記」「昼夜」を取得
  const { displayTime, displayDate, isDaylight } = useGameTime();
  
  const [view, setView] = useState<'status' | 'inventory' | 'workbench' | 'explore' | null>(null);
  const [mapBuildMode, setMapBuildMode] = useState(false);
  const [workbenchEntry, setWorkbenchEntry] = useState<"workbench" | "grit" | null>(null);

  useEffect(() => {
    if (view !== "workbench") setWorkbenchEntry(null);
    if (view !== null) setMapBuildMode(false);
  }, [view]);

  if (isLoading) return <div className="text-white p-10 font-mono animate-pulse">CONNECTING...</div>;

  return (
    <div className="relative w-full h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      
      {/* 📡 0. 最上部：G.R.I.T. システムクロック */}
      <div className="z-[50] flex w-full items-center justify-between border-b border-white/5s bg-black/60 px-3 py-1.5 font-mono text-[14px] text-slate-400 backdrop-blur-sm">
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 text-[11px] font-bold uppercase tracking-tight text-slate-500 transition-colors hover:text-amber-400"
        >
          ← タスク
        </button>
        <span className="text-emerald-400 font-bold">{displayDate}</span>
        
        <span className={`flex items-center gap-2 ${isDaylight ? "text-amber-400/80" : "text-blue-400/80"}`}>
          <span className="animate-pulse">{isDaylight ? "🔆" : "🌑"}</span>
          <span className="text-slate-100 font-bold">{displayTime}</span>
        </span>
      </div>

      {/* 📡 1. 常時表示：上部リソースバー */}
      <div className="z-[30] grid grid-cols-4 gap-1 p-2 bg-slate-900/90 border-b border-white/5 backdrop-blur-md text-[10px]">
        <div className="flex flex-col items-center border-r border-white/5">
          <span className="text-blue-400 font-bold flex items-center gap-1 uppercase tracking-tighter"><Users size={10}/> Pop</span>
          {/* resources.population ではなく resources?.population にする */}
          <span className="font-mono text-xs">{resources?.population ?? 0}</span>
        </div>
        <div className="flex flex-col items-center border-r border-white/5">
          <span className="text-yellow-400 font-bold flex items-center gap-1 uppercase tracking-tighter"><Zap size={10}/> Pwr</span>
          {/* ここも resources?. にする */}
          <span className="font-mono text-xs">{resources?.electric_power ?? 0}w</span>
        </div>
        <div className="flex flex-col items-center border-r border-white/5 text-orange-300">
          <span className="font-bold flex items-center gap-1 uppercase tracking-tighter"><Utensils size={10}/> Food</span>
          <span className="font-mono text-xs">{resources?.food ?? 0}</span>
        </div>
        <div className="flex flex-col items-center text-emerald-400">
          <span className="font-bold flex items-center gap-1 uppercase tracking-tighter"><Box size={10}/> Mat</span>
          <span className="font-mono text-xs">{resources?.minerals ?? 0}</span>
        </div>
      </div>

      {/* 🕹️ 2. メインコンテンツ（リソースバー下〜下部ナビ上まで。マップはこの領域いっぱい） */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {view === "status" && (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <UnitListView units={units} />
          </div>
        )}
        {view === "inventory" && (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <InventoryView />
          </div>
        )}
        {view === "explore" && (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <ExplorationView
              units={units}
              inventory={inventory}
              refresh={refresh}
            />
          </div>
        )}
        {view === "workbench" && (
          <div className="min-h-0 flex-1 overflow-y-auto">
            {workbenchEntry ? (
              <WorkbenchView
                units={units}
                resources={resources}
                inventory={inventory}
                refresh={refresh}
                entry={workbenchEntry}
              />
            ) : (
              <div className="h-full min-h-0 w-full bg-slate-950/50" />
            )}
          </div>
        )}

        {!view && (
          <GameMapView
            buildMode={mapBuildMode}
            onTapGrit={() => {
              setWorkbenchEntry("grit");
              setView("workbench");
            }}
            onTapWorkbench={() => {
              setWorkbenchEntry("workbench");
              setView("workbench");
            }}
          />
        )}
      </div>

      {/* 🕹️ 4. 下部：メインメニュー */}
      {!view && (
        <>
          <button
            type="button"
            aria-label={mapBuildMode ? "建造モードを終了" : "建造モード"}
            onClick={() => setMapBuildMode((v) => !v)}
            className={`fixed bottom-[7.25rem] right-4 z-[60] flex h-12 w-12 items-center justify-center rounded-full border shadow-lg backdrop-blur-md transition-colors ${
              mapBuildMode
                ? "border-amber-400 bg-amber-500/30 text-amber-200"
                : "border-white/15 bg-slate-900/90 text-slate-300 hover:text-white"
            }`}
          >
            <Hammer size={22} />
          </button>
          {mapBuildMode && (
            <div className="fixed bottom-[9.25rem] right-4 z-[60] max-w-[210px] rounded-xl border border-amber-500/30 bg-black/75 px-3 py-2 text-[10px] leading-snug text-amber-100 backdrop-blur">
              建造モード: 建造物を長押ししてドラッグで移設
            </div>
          )}
        </>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-[50] bg-slate-900/95 border-t border-white/10 p-4 pb-8 backdrop-blur-md shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
          {[
            { id: 'status', label: 'ユニット', icon: <Users2 size={18}/> },
            { id: 'inventory', label: '倉庫', icon: <Box size={18}/> },
            { id: 'workbench', label: '作業台', icon: <Settings size={18}/> },
            { id: 'explore', label: '探査', icon: <Navigation size={18}/> },
          ].map((btn) => (
            <button 
              key={btn.id}
              onClick={() => {
                if (btn.id === "workbench") setWorkbenchEntry(null);
                setView(btn.id as "status" | "inventory" | "workbench" | "explore");
              }}
              className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all border
                ${view === btn.id 
                  ? 'bg-amber-500/20 border-amber-500 text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
                  : 'bg-slate-800/50 border-white/5 text-slate-500 hover:text-slate-300'}`}
            >
              {btn.icon}
              <span className="text-[10px] font-black">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {view && (
        <button
          type="button"
          onClick={() => setView(null)}
          className="absolute right-4 top-[5.5rem] z-[35] rounded-full border border-white/5 bg-slate-900/50 p-2 text-slate-500 transition-colors hover:text-white"
          aria-label="マップに戻る"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}