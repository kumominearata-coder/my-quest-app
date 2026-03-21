import { ChevronLeft, Bell, Volume2, ShieldCheck } from 'lucide-react';
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