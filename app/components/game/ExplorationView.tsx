// app/components/game/ExplorationView.tsx
"use client";

import { useEffect, useState } from "react";
import { MISSIONS } from "../../types/ExplorationMission";
import { useCountdown } from "../../hooks/game/useCountdown";
import { useExploration } from "../../hooks/game/useExploration";
import { DEV_USER_ID } from "@/lib/devUser";
import { Navigation, X, Check } from "lucide-react";
import { formatDurationHMS } from "@/lib/game/formatTime";

type ExplorationViewProps = {
  units: any[];
  inventory: any[];
  refresh: (silent?: boolean) => void;
};

export default function ExplorationView({ units, inventory, refresh }: ExplorationViewProps) {
  const userId = DEV_USER_ID;

  // 💡 Hookからロジックをもらってくる
  const { startMission, completeMission } = useExploration(userId, inventory, refresh);

  const [selectingMissionId, setSelectingMissionId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const activeUnit = units.find(u => u.status === 'mission');
  const activeMissionId = activeUnit?.mission_id;
  const currentMission = MISSIONS.find(m => m.id === activeMissionId);
  const timeLeft = useCountdown(activeUnit?.mission_started_at, currentMission?.duration || 0);

  const targetMission = MISSIONS.find(m => m.id === selectingMissionId);
  const selectedUnit = units.find(u => u.id === selectedUnitId);

  // 💡 UI側の「開始ボタン」用ハンドラー
  const handleStart = async () => {
    if (!selectedUnitId || !selectingMissionId) return;
    const success = await startMission(selectingMissionId, selectedUnitId);
    if (success) {
      setSelectingMissionId(null);
      setSelectedUnitId(null);
    }
  };

  useEffect(() => {
  // 1. そもそも派遣中のユニットがいないなら何もしない
  if (!activeUnit || activeUnit.status !== 'mission' || !activeUnit.mission_started_at) {
    return;
  }

  // 2. timeLeft が 0 になった時だけチェックを開始
  if (timeLeft === 0) {
    // 3. 【超重要】DB上の開始時刻と現在の時刻を比較して、
    //    本当に設定された duration 以上の時間が経過しているか物理的に計算する
    const missionDef = MISSIONS.find(m => m.id === activeUnit.mission_id);
    if (!missionDef) return;

    const startTime = new Date(activeUnit.mission_started_at).getTime();
    const now = new Date().getTime();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);

    // duration（秒）に対して、経過時間が足りていなければ「誤作動」とみなして終了
    // 1秒くらいの誤差は許容範囲にするために -1 しておくよ
    if (elapsedSeconds < missionDef.duration - 1) {
      console.log("まだ帰ってくる時間じゃないよ。暴発防止！");
      return;
    }

    // 4. 全ての条件をクリアしたら完了処理！
    completeMission(activeUnit);
  }
}, [timeLeft, activeUnit]);

  return (
    <div className="p-4 bg-slate-950/50 min-h-full relative">
      <h2 className="text-xl font-black mb-6 text-amber-500 flex items-center gap-2">
        <Navigation size={20}/> 探査任務
      </h2>

      <div className="grid gap-3">
        {MISSIONS.map((m) => {
          const isProcessing = activeMissionId === m.id;
          return (
            <div 
              key={m.id} 
              className={`p-4 rounded-xl flex justify-between items-center transition-all ${
                isProcessing 
                  ? 'bg-amber-500/10 border border-amber-500/30' 
                  : 'bg-slate-900 border border-white/5'
              }`}
            >
              <div>
                <h3 className={`font-bold ${isProcessing ? 'text-amber-500' : 'text-white'}`}>{m.name}</h3>
                <p className="text-[10px] text-slate-500">
                  {formatDurationHMS(m.duration)} / <span className="text-amber-500/70">水 {m.costWater} ・ 食料 {m.costFood}</span>
                </p>
              </div>

              {isProcessing ? (
                <div className="bg-amber-500/20 text-amber-500 px-4 py-2 rounded-lg font-mono font-black text-sm border border-amber-500/30">
                  {formatDurationHMS(timeLeft)}
                </div>
              ) : (
                <button
                  onClick={() => setSelectingMissionId(m.id)}
                  disabled={!!activeUnit && activeUnit.status === 'mission'}
                  className={`px-4 py-2 rounded-lg font-black text-xs transition-all ${
                    activeUnit?.status === 'mission'
                      ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-white text-black hover:bg-amber-400'
                  }`}
                >
                  SELECT
                </button>
              )}
            </div>
          );
        })}
      </div>

      {selectingMissionId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-slate-900 border border-white/10 w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-black text-white">{targetMission?.name}</h3>
                <p className="text-xs text-slate-400">派遣するユニットを選んでね</p>
              </div>
              <button onClick={() => setSelectingMissionId(null)} className="text-slate-500 hover:text-white">
                <X size={20}/>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-8">
              {units.map((u) => (
                <button
                  key={u.id}
                  disabled={u.status !== 'idle'}
                  onClick={() => setSelectedUnitId(u.id)}
                  className={`relative p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                    selectedUnitId === u.id 
                      ? 'border-amber-500 bg-amber-500/10 text-amber-500' 
                      : u.status !== 'idle' 
                      ? 'border-transparent bg-slate-950 opacity-30 grayscale'
                      : 'border-white/5 bg-slate-950 text-slate-400'
                  }`}
                >
                  {selectedUnitId === u.id && <Check size={12} className="absolute top-1 right-1" />}
                  <span className="text-[10px] font-bold truncate w-full text-center">{u.master_id}</span>
                  <span className="text-[8px] uppercase">{u.status}</span>
                </button>
              ))}
            </div>

            <button
              disabled={!selectedUnit}
              onClick={handleStart} // 💡 ここを handleStart に変更！
              className={`w-full py-4 rounded-2xl font-black transition-all ${
                selectedUnit 
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20 active:scale-95' 
                  : 'bg-slate-800 text-slate-600'
              }`}
            >
              探査開始
            </button>
          </div>
        </div>
      )}
    </div>
  );
}