"use client";

import { useState } from "react"; 
import { motion } from "framer-motion";
import { useGameTime } from "../../hooks/game/useGameTime";
import { useGameData } from "../../hooks/game/useGameData";
import { useCountdown } from "../../hooks/game/useCountdown";
import { MISSIONS } from "../../types/ExplorationMission";
import UnitListView from "./UnitListView";
import ExplorationView from "./ExplorationView";
import { Zap, Utensils, Users, Box, Navigation, Users2, Settings, X } from "lucide-react";

/**
 * ここはあとで消す
 */
type Building = {
  id: string;
  type: 'factory' | 'power' | 'base';
  x: number;
  y: number;
};

const initialBuildings: Building[] = [
  { id: 'base-1', type: 'base', x: 10, y: 10 },
];

/**
 * 探査の残り時間表示のためのサブコンポーネント
 */
function MissionTimer({ unit, mission, onComplete }: { unit: any, mission: any, onComplete: (uid: string, m: any) => void }) {
  const timeLeft = useCountdown(unit.mission_started_at, mission.duration);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = Math.floor(timeLeft % 60);
  
  const timeString = hours > 0 
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    : `${minutes}:${seconds.toString().padStart(2, '0')}`;

  if (timeLeft <= 0) {
    return (
      <button 
        className="px-3 py-1 bg-emerald-500 text-black text-[10px] font-black rounded animate-bounce"
        onClick={() => onComplete(unit.id, mission.id)}
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
  const { units, resources, masterData, isLoading, startMission, completeMission, getFinalStats } = useGameData();
  
  // useGameTime から「季節・日数」「24時間表記」「昼夜」を取得
  const { displayTime, displayDate, isDaylight } = useGameTime();
  
  const [view, setView] = useState<'status' | 'party' | 'gacha' | 'explore' | null>(null);

  if (isLoading) return <div className="text-white p-10 font-mono animate-pulse">CONNECTING...</div>;

  return (
    <div className="relative w-full h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
      
      {/* 📡 0. 最上部：G.R.I.T. システムクロック */}
      <div className="z-[50] w-full bg-black/60 text-[14px] px-3 py-1.5 flex justify-between font-mono text-slate-400 border-b border-white/5s backdrop-blur-sm">
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
          <span className="font-mono text-xs">{resources.population.current}/{resources.population.total}</span>
        </div>
        <div className="flex flex-col items-center border-r border-white/5">
          <span className="text-yellow-400 font-bold flex items-center gap-1 uppercase tracking-tighter"><Zap size={10}/> Pwr</span>
          <span className="font-mono text-xs">{resources.electric_power}w</span>
        </div>
        <div className="flex flex-col items-center border-r border-white/5 text-orange-300">
          <span className="font-bold flex items-center gap-1 uppercase tracking-tighter"><Utensils size={10}/> Food</span>
          <span className="font-mono text-xs">{resources.food}</span>
        </div>
        <div className="flex flex-col items-center text-emerald-400">
          <span className="font-bold flex items-center gap-1 uppercase tracking-tighter"><Box size={10}/> Mat</span>
          <span className="font-mono text-xs">{resources.minerals}</span>
        </div>
      </div>

      {/* 🗺️ 2. 常時表示：ベースレイヤー（軽量化版マップ） */}
      <div className="absolute inset-0 z-[10] overflow-hidden bg-slate-950">
       <motion.div 
          drag
          // 1マス48px * 100マス = 4800px。はみ出しすぎないように制限
          dragConstraints={{ left: -(960 - window.innerWidth), right: 0, top: -(960 - window.innerHeight), bottom: 0 }}
          className="relative w-[960px] h-[960px]"
          style={{
            // CSSのグラデーションでグリッドを描画（DOM要素をゼロにする）
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px', // マスのサイズ
            cursor: "grab"
          }}
          whileTap={{ cursor: "grabbing" }}
        >
          {/* 建物データがあるものだけを描画 */}
          {initialBuildings.map((b) => (
            <div 
              key={b.id}
              className="absolute flex flex-col items-center justify-center transition-colors"
              style={{ 
                width: 48, 
                height: 48, 
                left: b.x * 48, 
                top: b.y * 48,
                // 拠点は目立つ色に
                backgroundColor: b.type === 'base' ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255, 255, 255, 0.05)',
               border: b.type === 'base' ? '1px solid rgba(168, 85, 247, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              {b.type === 'base' && (
                <>
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-ping" />
                  <div className="text-[8px] text-purple-400 font-black mt-1 uppercase">Base</div>
                </>
              )}
              {/* 座標を表示したい場合はここへ */}
              <span className="text-[6px] text-slate-700 absolute bottom-0.5 right-0.5 font-mono">
                {b.x},{b.y}
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* 🗺️ 探査ミッションの状況（マップ上に浮遊） */}
      <div className="relative z-[35] mt-4 space-y-2 w-full max-w-xs px-4 mx-auto">
        {units.filter((u: any) => u.status === 'mission').map((u: any) => {
          const mission = MISSIONS.find(m => m.id === u.mission_id);
          return (
            <div key={u.id} className="p-2 bg-black/60 border border-amber-500/30 rounded-lg flex justify-between items-center backdrop-blur-sm shadow-lg shadow-amber-900/10">
              <div className="flex flex-col">
                <span className="text-[8px] text-amber-500/60 font-black uppercase tracking-widest">Ongoing Mission</span>
                <span className="text-[10px] font-bold text-slate-200 uppercase tracking-tighter">
                  {masterData[u.master_id]?.name || "UNKNOWN UNIT"}
                </span>
              </div>
              {mission ? (
                <MissionTimer unit={u} mission={mission} onComplete={completeMission} />
              ) : (
                <span className="text-[10px] text-rose-500 font-mono">DATA_ERROR</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 🪟 3. オーバーレイレイヤー */}
      {view && (
        <div className="absolute inset-0 z-[40] bg-slate-950/95 backdrop-blur-md animate-in fade-in zoom-in duration-200 flex flex-col">
          <div className="flex justify-between items-center p-4 border-b border-white/5">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-widest">System / {view}</span>
            <button 
              onClick={() => setView(null)} 
              className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-slate-400 transition-all border border-white/5"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-24 pt-4">
            {view === 'status' && (
              <UnitListView 
                units={units}
                masterData={masterData}
                getFinalStats={getFinalStats}
                onClose={() => setView(null)} 
              />
            )}

            {view === 'explore' && (
              <ExplorationView 
                units={units.filter((u: any) => u.status !== 'mission')}
                masterData={masterData}
                getFinalStats={getFinalStats}
                onClose={() => setView(null)}
                onDeploy={async (unitId: string, mission: any) => {
                  await startMission(unitId, mission.id);
                  setView(null); 
                }}
              />
            )}

            {(view === 'party' || view === 'gacha') && (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 font-mono text-xs uppercase tracking-widest space-y-4">
                <span>Section Under Construction...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🕹️ 4. 下部：メインメニュー */}
      <div className="fixed bottom-0 left-0 right-0 z-[50] bg-slate-900/95 border-t border-white/10 p-4 pb-8 backdrop-blur-md shadow-[0_-10px_20px_rgba(0,0,0,0.5)]">
        <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
          {[
            { id: 'status', label: 'ユニット', icon: <Users2 size={18}/> },
            { id: 'party', label: '予備', icon: <Box size={18}/> },
            { id: 'gacha', label: '設定', icon: <Settings size={18}/> },
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

      {!view && (
        <button 
          onClick={onBack} 
          className="absolute top-16 right-4 z-[35] p-2 bg-slate-900/50 rounded-full text-slate-500 hover:text-white border border-white/5 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}