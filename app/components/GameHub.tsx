"use client";

import { motion } from "framer-motion";

type GameHubProps = {
  grit: number;
  onBack: () => void;
};

export default function GameHub({ grit, onBack }: GameHubProps) {
  return (
    <div className="relative w-full h-screen bg-slate-950 flex flex-col overflow-hidden">
      
      {/* 🌿 上部：簡易ステータスバー */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-start z-20">
        <div className="bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl">
          <span className="text-[10px] text-slate-400 block font-black leading-none mb-1 uppercase tracking-tighter">Current Grit</span>
          <span className="text-xl font-mono font-black text-purple-400">{grit.toLocaleString()} G</span>
        </div>

        <button 
          onClick={onBack}
          className="w-10 h-10 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* 🌿 中央：キャラ立ち絵エリア（今は空けておくよ） */}
      <div className="flex-1 relative flex items-center justify-center">
        {/* 将来ここに <img /> を置いて、おにい自慢のAIキャラを表示させよう！ */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10" />
        <div className="text-slate-800 font-black text-4xl italic select-none opacity-20 transform -rotate-12">
          NO UNIT SELECTED
        </div>
      </div>

      {/* 🌿 下部1/4：メニューエリア */}
      <div className="h-1/3 bg-slate-900/80 backdrop-blur-2xl border-t border-white/10 p-6 z-20 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <div className="max-w-md mx-auto h-full flex flex-col justify-center">
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'gacha', label: 'ガチャ', sub: 'Summon', color: 'from-purple-600 to-indigo-600' },
              { id: 'explore', label: '探索', sub: 'Explore', color: 'from-emerald-600 to-teal-600' },
              { id: 'party', label: '編成', sub: 'Party', color: 'from-blue-600 to-cyan-600' },
            ].map((item) => (
              <button
                key={item.id}
                className={`relative group aspect-square rounded-2xl bg-gradient-to-br ${item.color} p-0.5 shadow-lg active:scale-95 transition-all`}
                onClick={() => alert(`${item.label}機能は週末かな？`)}
              >
                <div className="w-full h-full bg-slate-900/40 rounded-[14px] flex flex-col items-center justify-center gap-1 group-hover:bg-transparent transition-colors">
                  <span className="text-xs font-black text-white tracking-widest">{item.label}</span>
                  <span className="text-[8px] text-white/50 font-bold uppercase tracking-tighter">{item.sub}</span>
                </div>
              </button>
            ))}
          </div>

          <p className="text-center text-[9px] text-slate-500 font-bold tracking-[0.3em] uppercase mt-8 opacity-50">
            System: Tactical Scavenger v1.0
          </p>
        </div>
      </div>

    </div>
  );
}