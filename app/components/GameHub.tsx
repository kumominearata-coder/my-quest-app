"use client";

import { useState } from "react"; 
import NotificationSetting from "./NotificationSetting"; // 通知設定コンポーネント
import { useGameData } from "../hooks/game/useGameData";

export default function GameHub({ grit, onBack }: { grit: number; onBack: () => void }) {
  // 🌿 inventory も取得するように追加（カバンの中身を表示するため）
  const { units, inventory, masterData, isLoading, getFinalStats } = useGameData();

  // 🌿 どの画面を表示するか管理するステートを追加
  const [view, setView] = useState<'status' | 'party' | 'gacha'>('status');

  // 読み込み中
  if (isLoading) return <div className="text-white p-10">データ受信中...</div>;

  if (!isLoading && units.length === 0) {
  return <div className="text-white p-10 font-mono">NO DATA FOUND IN SUPABASE...</div>;
}

  // 最初の1体（謎の少女）を取得
  const myUnit = units[0];
  const master = myUnit ? masterData[myUnit.master_id] : null;

  // 🌿 装備を含めた最終ステータスを計算！
  const finalStats = myUnit 
  ? getFinalStats(myUnit) 
  : { hp: 0, vit: 0, cap: 0, int: 0, edu: 0 };

  return (
    <div className="relative w-full h-screen bg-slate-950 text-white flex flex-col">
      {/* 🌿 上部：戻るボタンなど */}
      <div className="p-6 flex justify-between items-center">
        <div className="bg-slate-900 border border-white/10 px-4 py-1 rounded-full text-xs">
          Game Mode: Scavenger
        </div>
        <button onClick={onBack} className="text-slate-400">✕</button>
      </div>

      {/* 🌿 中央：ステータス表示エリア */}
      <div className="flex-1 overflow-y-auto">
        {view === 'status' && (
          <div className="flex flex-col items-center justify-center p-6 min-h-full">
            {/* キャラ名 */}
            {/* キャラ名とレベル表示エリア */}
            {master && (
              <>
                <h2 className="text-2xl font-black text-center mb-1 text-purple-400 uppercase tracking-widest">
                  {master.name}
                </h2>
                <p className="text-[10px] text-slate-500 text-center mb-8 uppercase font-bold tracking-tighter">
                  Level {myUnit.level} / Soulbound Companion
                </p>
              </>
            )}

            {/* ステータスリスト */}
            <div className="space-y-4">
              {[
                { label: 'HP', value: finalStats.hp, color: 'text-red-400', desc: '生命反応' },
                { label: 'VIT', value: finalStats.vit, color: 'text-red-400', desc: '体力' },
                { label: 'CAP', value: finalStats.cap, color: 'text-red-400', desc: '運搬' },
                { label: 'INT', value: finalStats.int, color: 'text-blue-400', desc: '知性' },
                { label: 'EDU', value: finalStats.edu, color: 'text-emerald-400', desc: '知識' },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between border-b border-white/5 pb-2">
                  <div>
                    <span className={`text-xl font-mono font-black ${s.color}`}>{s.label}</span>
                    <span className="ml-2 text-[9px] text-slate-500 uppercase font-bold">{s.desc}</span>
                  </div>
                  <span className="text-2xl font-mono font-black">{s.value}</span>
                </div>
              ))}
            </div>

            {/* 装備中のアイテム表示 */}
            <div className="mt-8">
              <span className="text-[9px] text-slate-500 uppercase font-bold block mb-2">Equipped Items</span>
              <div className="flex gap-2">
                {myUnit.equipped_item_ids.length > 0 ? (
                  myUnit.equipped_item_ids.map(id => (
                    <div key={id} className="px-3 py-1 bg-slate-800 border border-white/10 rounded-md text-[10px] text-slate-300">
                      {masterData[id]?.name || id}
                    </div>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-600 italic">No equipment</span>
                )}
              </div>
            </div>

            {/* 🌿 システム通知設定：ステータス画面の最後に配置 */}
              <div className="mt-12 w-full max-w-[240px] animate-in fade-in duration-700 delay-300">
                <NotificationSetting />
                <p className="text-[8px] text-slate-600 text-center mt-2 uppercase tracking-widest font-mono">
                  Signal Sync / Push Protocol
                </p>
              </div>
             </div>
             )}

        {/* --- 🌿 編成画面（DECK）の中身 --- */}
        {view === 'party' && (
          <div className="p-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] text-center mb-8">Inventory & Equipment</h3>
            
            {inventory.length > 0 ? (
              <div className="grid gap-3">
                {inventory.map((item) => {
                  const itemMaster = masterData[item.item_id];
                  const isEquipped = myUnit?.equipped_item_ids?.includes(item.item_id) ?? false;

                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-2xl border transition-all ${isEquipped ? 'bg-purple-600/10 border-purple-500/50' : 'bg-slate-900 border-white/5'}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm font-bold text-slate-200">{itemMaster?.name}</div>
                          <div className="text-[10px] text-slate-500 mt-1">{itemMaster?.description}</div>
                        </div>
                        {/* 🌿 ここの onClick は次回のステップで Supabase 更新関数を呼ぶよ */}
                        <button 
                          className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter transition-all ${
                            isEquipped 
                              ? 'bg-purple-500 text-white' 
                              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                          }`}
                        >
                          {isEquipped ? 'Equipped' : 'Equip'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 text-slate-600 text-xs italic">Your inventory is empty.</div>
            )}
          </div>
        )}
      </div>

{/* 🌿 下部メニュー（onClickを追加したよ！） */}
      <div className="h-1/4 bg-slate-900/80 p-6">
        <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
          <button 
            onClick={() => setView('status')} // 探索の代わりに今はステータス
            className={`aspect-square rounded-2xl border flex flex-col items-center justify-center ${view === 'status' ? 'bg-purple-600/20 border-purple-500' : 'bg-slate-800 border-white/10'}`}
          >
            <span className="text-xs font-bold">ステータス</span>
          </button>
          
          <button 
            onClick={() => setView('party')} // 編成画面へ
            className={`aspect-square rounded-2xl border flex flex-col items-center justify-center ${view === 'party' ? 'bg-amber-600/20 border-amber-500 shadow-[0_0_20px_rgba(217,119,6,0.2)]' : 'bg-slate-800 border-white/10'}`}
          >
            <span className="text-xs font-bold">編成</span>
          </button>

          <button 
            onClick={() => alert('ガチャはまだ準備中だよ')} 
            className="aspect-square rounded-2xl bg-slate-800 border border-white/10 flex flex-col items-center justify-center"
          >
            <span className="text-xs font-bold text-slate-400">ガチャ</span>
          </button>
        </div>
      </div>
    </div>
  );
}