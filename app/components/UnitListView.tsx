// components/UnitListView.tsx
"use client";

import { UserUnit, MasterData } from "@/app/types/game1";
import { X, Heart, Zap, Package, Brain, GraduationCap, Microscope } from "lucide-react";

interface Props {
  units: UserUnit[];
  masterData: Record<string, MasterData>;
  getFinalStats: (unit: UserUnit) => any;
  onClose: () => void;
}

export default function UnitListView({ units, masterData, getFinalStats, onClose }: Props) {
  return (
    <div className="absolute inset-0 z-[40] bg-slate-950/95 backdrop-blur-xl p-6 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* ヘッダー：調査録風 */}
      <div className="flex justify-between items-center mb-8 border-b border-purple-500/20 pb-4">
        <div>
          <h2 className="text-xl font-black text-purple-400 tracking-[0.2em] uppercase flex items-center gap-2">
            <Microscope size={20} /> Personnel Dossier
          </h2>
          <p className="text-[8px] text-slate-500 uppercase tracking-widest mt-1">
            Registered Biological Units / Sector-01
          </p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400 transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* ユニットリスト */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {units.map((unit) => {
          const master = masterData[unit.master_id];
          const finalStats = getFinalStats(unit);
          
          return (
            <div 
              key={unit.id} 
              className="bg-slate-900/50 border border-white/5 rounded-2xl p-5 relative overflow-hidden group hover:border-purple-500/30 transition-all"
            >
              {/* 背景の装飾デコレーション */}
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="text-4xl font-black font-mono">#{unit.master_id}</span>
              </div>

              <div className="flex items-start gap-4">
                {/* レベル表示（紋章風） */}
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full border-2 border-purple-500/20 flex items-center justify-center font-mono font-black text-purple-400 bg-purple-500/5">
                    {unit.level}
                  </div>
                  <span className="text-[7px] text-slate-500 mt-1 font-bold uppercase">Level</span>
                </div>

                {/* 名前とステータス */}
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-200 mb-3 tracking-wider">
                    {master?.name || "Unknown Unit"}
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-y-3 gap-x-2">
                    {[
                      { icon: <Heart size={10} />, label: 'HP', val: finalStats.hp, color: 'text-red-400' },
                      { icon: <Zap size={10} />, label: 'VIT', val: finalStats.vit, color: 'text-amber-400' },
                      { icon: <Package size={10} />, label: 'CAP', val: finalStats.cap, color: 'text-orange-400' },
                      { icon: <Brain size={10} />, label: 'INT', val: finalStats.int, color: 'text-blue-400' },
                      { icon: <GraduationCap size={10} />, label: 'EDU', val: finalStats.edu, color: 'text-emerald-400' },
                    ].map((s) => (
                      <div key={s.label} className="flex flex-col">
                        <span className={`text-[8px] font-bold uppercase flex items-center gap-1 ${s.color} opacity-70`}>
                          {s.icon} {s.label}
                        </span>
                        <span className="text-sm font-mono font-bold text-slate-300">
                          {s.val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 装備品ミニタグ */}
              <div className="mt-4 pt-3 border-t border-white/5 flex gap-1">
                {unit.equipped_item_ids.map(id => (
                  <span key={id} className="text-[8px] px-2 py-0.5 bg-white/5 rounded-md text-slate-500 font-mono">
                    {masterData[id]?.name || id}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}