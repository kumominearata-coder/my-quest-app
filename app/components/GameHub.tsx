"use client";

import { useState } from "react"; 
import { useGameData } from "../hooks/game/useGameData";
import { useCountdown } from "../hooks/game/useCountdown";
import { MISSIONS } from "../types/ExplorationMission";
import UnitListView from "./UnitListView";
import ExplorationView from "./ExplorationView";
import { Zap, Utensils, Users, Box, Navigation, Users2, Settings, X } from "lucide-react";

{/* 探査の残り時間表示のためのサブコンポーネント */}
function MissionTimer({ unit, mission, onComplete }: { unit: any, mission: any, onComplete: (uid: string, m: any) => void }) {
  const timeLeft = useCountdown(unit.mission_started_at, mission.duration);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;
  const timeString = hours > 0 
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`;

  if (timeLeft <= 0) {
    return (
      <button 
        className="px-3 py-1 bg-emerald-500 text-black text-[10px] font-black rounded animate-bounce"
        onClick={() => {
         onComplete(unit.id, mission);
        }}
      >
        RETURN READY
      </button>
    );
  }

  return (
    <span className="text-[10px] font-mono text-amber-400">
      RETURNING IN {timeString}
    </span>
  );
}

export default function GameHub({ grit, onBack }: { grit: number; onBack: () => void }) {
  const { units, inventory, masterData, resources, isLoading, getFinalStats, startMission, completeMission } = useGameData();
  
  // ✅ view が null の時は「マップだけ」が見えている状態にするよ
  const [view, setView] = useState<'status' | 'party' | 'gacha' | 'explore' | null>(null);

  if (isLoading) return <div className="text-white p-10 font-mono animate-pulse">CONNECTING...</div>;

  return (
    <div className="relative w-full h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      
      {/* 📡 1. 常時表示：上部リソースバー */}
      <div className="z-[30] grid grid-cols-4 gap-1 p-2 bg-slate-900/90 border-b border-white/5 backdrop-blur-md text-[10px]">
        {/* ...（リソースの内容はさっきと同じなので省略）... */}
        <div className="flex flex-col items-center"><span className="text-blue-400 font-bold"><Users size={10}/> POP</span><span className="font-mono">{resources.population.current}/{resources.population.total}</span></div>
        <div className="flex flex-col items-center"><span className="text-yellow-400 font-bold"><Zap size={10}/> PWR</span><span className="font-mono">{resources.electric_power}w</span></div>
        <div className="flex flex-col items-center text-orange-300"><span className="text-orange-300 font-bold"><Utensils size={10}/> FOOD</span><span className="font-mono">{resources.food}</span></div>
        <div className="flex flex-col items-center text-emerald-400"><span className="text-emerald-400 font-bold"><Box size={10}/> MAT</span><span className="font-mono">{resources.minerals}</span></div>
      </div>

      {/* 🗺️ 2. 常時表示：ベースレイヤー（マップ） */}
      <div className="absolute inset-0 z-[10] flex flex-col items-center justify-center p-4 pt-16">
        <h3 className="text-[10px] text-slate-500 mb-4 tracking-[0.3em] font-black uppercase">Sector-01 / Main Base</h3>
        <div className="grid grid-cols-5 gap-1 bg-slate-900/50 p-1 border border-white/10 rounded-sm">
          {[...Array(25)].map((_, i) => (
            <div key={i} className={`w-12 h-12 border border-white/5 flex items-center justify-center ${i === 12 ? 'bg-purple-500/10' : 'bg-slate-950/40 opacity-30'}`}>
              {i === 12 && <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping" />}
            </div>
          ))}
        </div>
      </div>

      {/* 🗺️ 探査からの帰還カウントダウン */}
      <div className="relative z-[35] mt-8 space-y-2 w-full max-w-xs px-4">
        {units.filter(u => u.status === 'mission').map(u => {
          const mission = MISSIONS.find(m => m.id === u.mission_id);
          return (
            <div key={u.id} className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex justify-between items-center">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-tighter">
                {masterData[u.master_id]?.name}
              </span>
              {mission ? (
                <MissionTimer unit={u} mission={mission} onComplete={completeMission} />
              ) : (
                <span className="text-[10px]">DATA ERROR</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 🪟 3. 重なる画面：オーバーレイレイヤー */}
      {view && (
        <div className="absolute inset-0 z-[40] bg-slate-950/90 backdrop-blur-md animate-in fade-in zoom-in duration-200 p-6 flex flex-col">
          {/* 共通の「戻る」ボタン */}
          <div className="flex justify-end mb-4">
            <button 
              onClick={() => setView(null)} 
              className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 transition-all"
            >
              <X size={24} />
            </button>
          </div>

            {/* ✅ ユニット画面レイヤー */}
            {view === 'status' && (
              <UnitListView 
                units={units}
                masterData={masterData}
                getFinalStats={getFinalStats}
                onClose={() => setView(null)} 
               />
            )}

            {/* ✅ 探査画面レイヤー */}
            {view === 'explore' && (
              <ExplorationView 
                units={units.filter(u => u.status !== 'mission')}
                masterData={masterData}
                getFinalStats={getFinalStats}
                onClose={() => setView(null)}
                onDeploy={async (unitId, mission) => {
                  await startMission(unitId, mission.id);
                  // ここで将来的に Supabase を叩く！
                  setView(null); 
                }}
              />
           )}
            
            {/* view === 'party' など他の画面も同様に */}
          </div>
      )}

      {/* 🕹️ 4. 下部：コマンドメニュー（画面最下部に固定） */}
      <div className="fixed bottom-0 left-0 right-0 z-[50] bg-slate-900/95 border-t border-white/10 p-4 pb-8 backdrop-blur-md">
        <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
          {[
            { id: 'status', label: 'ユニット', icon: <Users2 size={18}/> },
            { id: 'party', label: '予備', icon: <Box size={18}/> },
            { id: 'gacha', label: '予備', icon: <Settings size={18}/> },
            { id: 'explore', label: '探査', icon: <Navigation size={18}/> },
          ].map((btn) => (
            <button 
              key={btn.id}
              onClick={() => setView(btn.id as any)}
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

      {/* ゲーム終了ボタン（基地からの離脱） */}
      {!view && (
        <button onClick={onBack} className="absolute top-16 right-4 z-[35] p-2 bg-slate-900/50 rounded-full text-slate-500 hover:text-white border border-white/5">
          <X size={16} />
        </button>
      )}
    </div>
  );
}