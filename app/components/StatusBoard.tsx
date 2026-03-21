// app/components/StatusBoard.tsx
type StatusProps = {
  grit: number;
  viewMode: 'task' | 'game'; 
  onViewChange: (mode: 'task' | 'game') => void; 
};

import { Settings, Gamepad2, LayoutList } from 'lucide-react';

export default function StatusBoard({ grit, viewMode, onViewChange }: any) {
  return (
    <div className="bg-slate-800 p-6 rounded-2xl border-t-4 border-amber-600 w-full max-w-md mb-6 shadow-xl relative overflow-hidden">

      {/* ✅ 右上の設定ボタン：absoluteで配置することで、中央のGrit表示を邪魔しないようにしたよ */}
      <div className="absolute top-3 right-3">
        <button 
          onClick={() => onViewChange('settings')}
          className={`p-2 rounded-lg transition-all ${
            viewMode === 'settings' 
            ? 'bg-amber-500 text-black' 
            : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
        >
          {/* 設定画面のときは、歯車をゆっくり回して「調整中」っぽさを演出 */}
          <Settings size={20} className={viewMode === 'settings' ? "animate-spin" : ""} style={{ animationDuration: '3s' }} />
        </button>
      </div>
      
      <div className="flex justify-center items-center py-4">
        <div className="flex flex-col items-center">
          <span className="text-slate-500 text-[10px] uppercase tracking-tighter mb-1">Total Accumulated Grit</span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-5xl text-amber-400 font-bold">{grit.toLocaleString()}</span>
            <span className="text-amber-600 font-bold text-xl">Grit</span>
          </div>
        </div>
      </div>
      
{/* ゲーム画面へのエントリーボタン */}
      <div className="mt-2 flex justify-center">
        <button 
          onClick={() => onViewChange('game')}
          className="group relative px-6 py-2 bg-slate-900 border border-amber-500/30 rounded-full overflow-hidden transition-all hover:border-amber-400 active:scale-95"
        >
          {/* 輝く背景演出 */}
          <div className="absolute inset-0 bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors" />
          
          <span className="relative text-[11px] font-black tracking-[0.2em] text-amber-500 group-hover:text-amber-400">
            ENTER GAME AREA ▽
          </span>
        </button>
      </div>
    </div>
  );
}