import { ChevronLeft, Bell, Volume2, ShieldCheck, Lightbulb } from 'lucide-react';
import NotificationSetting from "./NotificationSetting"; // 通知設定コンポーネント

export default function SettingsView({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col h-full bg-slate-950 text-zinc-300 font-sans">
      {/* ヘッダー */}
      <div className="p-6 flex items-center gap-4 border-b border-white/5 bg-zinc-900/20">
        <button onClick={onBack} className="p-2 -ml-2 hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-black tracking-widest uppercase text-white">System Settings</h1>
      </div>

      {/* 設定リスト */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8">

        {/* ✅ 追加：タスク作りのヒント (おにい専用メモ) */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center gap-2 mb-4 text-amber-400">
            <Lightbulb size={16} />
            <h2 className="text-xs font-black tracking-tighter uppercase">Task Design Guide</h2>
          </div>
          <div className="bg-gradient-to-br from-zinc-900 to-black p-5 rounded-2xl border border-amber-500/20 shadow-inner">
            <div className="space-y-4">
              <div>
                <p className="text-[12px] text-amber-500/60 font-mono mb-1 tracking-widest uppercase">基本方程式</p>
                <div className="bg-black/50 p-3 rounded-lg border border-white/5 font-mono text-center">
                  <span className="text-amber-200 text-sm">報酬 = (難易度 × 所要時間) + 精神的負荷</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-[12px] font-mono text-zinc-500 text-center uppercase tracking-tighter">
                <div><span className="text-zinc-300 block text-[16px]">難易度</span>Difficulty<br/>(1-10)</div>
                <div><span className="text-zinc-300 block text-[16px]">所要時間(min)</span>Time<br/>(min/10)</div>
                <div><span className="text-zinc-300 block text-[16px]">精神的負荷</span>Mental<br/>Cost</div>
              </div>

              <div className="pt-2 border-t border-white/5">
                <p className="text-[12px] text-zinc-400 leading-relaxed">
                  <span className="text-rose-400 font-bold">【担保の原則】</span><br />
                  サボった際のダメージを報酬の<span className="text-white font-bold">1.5倍~2倍</span>に設定する。<br />損失回避性を利用し、実行を強制させる。
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* セクション：通知 */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-amber-500/80">
            <Bell size={16} />
            <h2 className="text-xs font-black tracking-tighter uppercase">Notifications</h2>
          </div>

          <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
            <NotificationSetting />
            <p className="text-[9px] text-zinc-600 mt-3 text-center uppercase font-mono tracking-widest">
              Push Protocol: Active
            </p>
          </div>
        </section>

        {/* セクション：サウンド (将来用) */}
        <section>
          <div className="flex items-center gap-2 mb-4 text-cyan-500/80">
            <Volume2 size={16} />
            <h2 className="text-xs font-black tracking-tighter uppercase">Audio Performance</h2>
          </div>
          <div className="p-4 border border-dashed border-white/10 rounded-xl text-center">
            <p className="text-[11px] text-zinc-600 italic">No audio configurations found...</p>
          </div>
        </section>

      </div>

      {/* フッター（バージョン情報とか） */}
      <div className="p-8 text-center opacity-20 pointer-events-none">
        <p className="text-[10px] font-mono tracking-widest">VER 1.0.4 // GRIT_OS</p>
      </div>
    </div>
  );
}