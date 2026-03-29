// components/ExplorationView.tsx
"use client";

import { useState } from "react";
import { MISSIONS, Mission } from "@/app/types/ExplorationMission"; // パスは適宜調整してね
import { UserUnit, MasterData } from "@/app/types/game1";
import { Navigation, X, ShieldAlert, Timer, TrendingUp } from "lucide-react";

interface Props {
  units: UserUnit[];
  masterData: Record<string, MasterData>;
  getFinalStats: (unit: UserUnit) => any;
  onDeploy: (unitId: string, mission: Mission) => void;
  onClose: () => void;
}

export default function ExplorationView({ units, masterData, getFinalStats, onDeploy, onClose }: Props) {
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  // 生存確率計算ロジック
  const calculateSuccessRate = (unit: UserUnit, mission: Mission) => {
    const stats = getFinalStats(unit);
    const bonus = (stats[mission.requiredStat] || 0) * 0.1;
    return Math.min(99, mission.baseSurvivalRate + bonus).toFixed(1);
  };

  return (
    <div className="absolute inset-0 z-[40] bg-slate-950/90 backdrop-blur-md p-6 flex flex-col">
      {/* ヘッダー */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-amber-500 tracking-widest uppercase flex items-center gap-2">
          <Navigation size={20} /> Exploration
        </h2>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400"><X size={24} /></button>
      </div>

      {/* 任務リスト */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {MISSIONS.map(m => (
          <button 
            key={m.id} 
            onClick={() => setActiveMission(m)}
            className="w-full p-4 bg-slate-900/50 border border-white/5 rounded-2xl text-left hover:border-amber-500/50 transition-all group"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-bold text-slate-200 group-hover:text-amber-400">{m.name}</div>
                <div className="text-[10px] text-slate-500 mt-1">{m.description}</div>
              </div>
              <span className={`text-[8px] px-2 py-0.5 rounded border ${m.risk === 'LOW' ? 'border-emerald-500/50 text-emerald-500' : 'border-red-500/50 text-red-500'}`}>
                {m.risk}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* 詳細ポップアップ（モーダル） */}
      {activeMission && (
        <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="w-full max-w-sm bg-slate-900 border border-amber-500/30 p-6 rounded-3xl shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-black text-amber-500 mb-1 uppercase">{activeMission.name}</h3>
            <p className="text-[10px] text-slate-500 mb-6 uppercase tracking-widest font-mono">Mission Briefing</p>
            
            <div className="grid grid-cols-2 gap-2 mb-6">
              <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                <span className="text-[8px] text-slate-500 block uppercase">Duration</span>
                <span className="text-xs font-mono flex items-center gap-1">
                  <Timer size={10}/> 
                  {(() => {
                    const d = activeMission.duration;
                    const h = Math.floor(d / 3600);
                    const m = Math.floor((d % 3600) / 60);
                    const s = d % 60;
      
                    return h > 0 
                      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
                      : `${m}:${s.toString().padStart(2, '0')}`;
                  })()}
                </span>
              </div>
              <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                <span className="text-[8px] text-slate-500 block uppercase">Main Stat</span>
                <span className="text-xs font-mono flex items-center gap-1 uppercase"><TrendingUp size={10}/> {activeMission.requiredStat}</span>
              </div>
            </div>

            <div className="text-[10px] font-bold text-slate-500 mb-2 uppercase">Select Operative</div>
            <div className="space-y-2 max-h-40 overflow-y-auto mb-6 pr-2">
              {units.map(u => (
                <button 
                  key={u.id}
                  onClick={() => setSelectedUnitId(u.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all ${selectedUnitId === u.id ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.1)]' : 'border-white/5 bg-white/5'}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-200">{masterData[u.master_id]?.name}</span>
                    <span className="text-[10px] font-mono text-emerald-400">{calculateSuccessRate(u, activeMission)}%</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => {setActiveMission(null); setSelectedUnitId(null);}} className="flex-1 py-3 text-xs font-bold text-slate-500 bg-white/5 rounded-xl hover:bg-white/10">ABORT</button>
              <button 
                disabled={!selectedUnitId}
                onClick={() => {
                  if(selectedUnitId) onDeploy(selectedUnitId, activeMission);
                  setActiveMission(null);
                }}
                className="flex-1 py-3 text-xs font-black bg-amber-500 text-black rounded-xl disabled:opacity-20 shadow-[0_4px_20px_rgba(245,158,11,0.3)]"
              >
                DEPLOY
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}