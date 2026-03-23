"use client";

import { useState, useEffect } from "react";

type TaskFormProps = {
  newTaskTitle: string;
  setNewTaskTitle: (value: string) => void;
  note: string;
  setNote: (value: string) => void;
  tagsInput: string;
  setTagsInput: (value: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  rewardGrit: number;
  setRewardGrit: (value: number) => void;
  penaltyGrit: number;
  setPenaltyGrit: (value: number) => void;
  calcParams: { t: number; d: number; s: number; i: number };
  setCalcParams: (val: { t: number; d: number; s: number; i: number }) => void;
  habitType: string; 
  setHabitType: (value: string) => void;
  dueDate: string;
  setDueDate: (value: string) => void;
  targetDays: number[];
  setTargetDays: (days: number[]) => void;
  addTask: () => void;
  editingTask: any | null;
  updateTask: () => void;
  deleteTask: () => void;
  cancelEdit: () => void;
};

// --- 定数設定 ---
const DIFF_SETTINGS = [
  { val: 1, label: "低", desc: "単純な軽作業", rate: 0.5 },
  { val: 2, label: "やや低", desc: "慣れた作業・ルーチンワーク", rate: 0.8 },
  { val: 3, label: "中", desc: "通常タスク", rate: 1.0 },
  { val: 4, label: "やや高", desc: "集中が必要", rate: 2.0 },
  { val: 5, label: "高", desc: "極限状態", rate: 5.0 },
];

const STRESS_SETTINGS = [
  { val: 1, label: "無", desc: "リフレッシュ", rate: 0.5 },
  { val: 2, label: "微", desc: "無心", rate: 1.0 },
  { val: 3, label: "中", desc: "要気合", rate: 2.0 },
  { val: 4, label: "大", desc: "気が重い・やりたくない", rate: 4.0 },
  { val: 5, label: "極", desc: "逃げ出したい", rate: 8.0 },
];

const IMPORTANCE_SETTINGS = [
  { val: 1, label: "低", desc: "時間の浪費・娯楽", rate: 0.1 },
  { val: 2, label: "やや低", desc: "現状維持・管理", rate: 1.0 },
  { val: 3, label: "中", desc: "習慣化・健康", rate: 2.0 },
  { val: 4, label: "高", desc: "目標に直結", rate: 4.0 },
  { val: 5, label: "極", desc: "人生の分岐点", rate: 8.0 },
];

export default function TaskForm({
  newTaskTitle, setNewTaskTitle, note, setNote, tagsInput, setTagsInput,
  selectedType, setSelectedType, rewardGrit, setRewardGrit, penaltyGrit, setPenaltyGrit, calcParams, setCalcParams,
  habitType, setHabitType, dueDate, setDueDate, targetDays, setTargetDays,
  addTask, editingTask, updateTask, deleteTask, cancelEdit
}: TaskFormProps) {

  // 📝 内部ステートやタグが動いたら自動計算
  useEffect(() => {
    const { t, d, s, i } = calcParams;
    const gD = DIFF_SETTINGS.find(x => x.val === d)?.rate || 1;
    const hS = STRESS_SETTINGS.find(x => x.val === s)?.rate || 1;
    const kI = IMPORTANCE_SETTINGS.find(x => x.val === i)?.rate || 1;

    const calculatedReward = Math.round((10 * t * gD * hS * kI) + (t * 5));
    setRewardGrit(calculatedReward);

    const isKaji = tagsInput.includes("家事");
    const calculatedPenalty = isKaji ? 5000 : Math.round(calculatedReward * 0.8);
    setPenaltyGrit(calculatedPenalty);
  }, [calcParams, tagsInput]);

  return (
    <div className={`w-full max-w-md space-y-4 bg-slate-800 p-5 rounded-3xl border-2 transition-all shadow-2xl text-sm ${
      editingTask ? "border-purple-500 shadow-purple-500/20" : "border-slate-700 shadow-black/50"
    }`}>
      
      {/* ヘッダー部分：タイトルと閉じるボタン */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-700/50 mb-2">
        <h2 className="text-base font-black text-white flex items-center gap-2">
          <span className={`w-2 h-4 rounded-full ${editingTask ? "bg-purple-500" : "bg-red-500"}`}></span>
          {editingTask ? "タスク編集" : "新規タスク登録"}
        </h2>
        
        {/* Windows のウィンドウみたいな × ボタン */}
        <button 
          onClick={cancelEdit} 
          className="text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-all p-1.5"
          title="閉じる"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 種別切り替え */}
      <div className="flex items-center justify-center pt-2 pb-1">
        <div className="flex bg-slate-900 w-full rounded-xl p-1 border border-slate-700">
          {["habit", "daily", "todo"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`flex-1 py-2.5 rounded-lg text-[14px] font-black transition-all ${
                selectedType === type 
                  ? "bg-purple-700 text-white shadow-inner scale-95" 
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {type === "habit" ? "✨ 習慣" : type === "daily" ? "📅 日課" : "📜 To Do"}
            </button>
          ))}
        </div>
      </div>

      {/* タイトル欄 */}
      <input
        type="text"
        value={newTaskTitle}
        onChange={(e) => setNewTaskTitle(e.target.value)}
        placeholder="クエスト名を入力..."
        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white font-bold placeholder:text-slate-600"
      />

      {/* ノート欄 */}
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="詳細なメモ（任意）"
        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white text-xs h-20 resize-none placeholder:text-slate-600"
      />

      {/* タグ欄 */}
      <input
        type="text"
        value={tagsInput}
        onChange={(e) => setTagsInput(e.target.value)}
        placeholder="タグ（カンマ区切り：家事, 勉強, 数学）"
        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-white text-[11px] placeholder:text-slate-600"
      />

      {/* 習慣タスクの「＋」「－」ボタンの設定エリア */}
      <div className="flex flex-wrap gap-2 items-center min-h-[32px]">
        {selectedType === "habit" && (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
            <span className="text-[12px] text-slate-500 font-black uppercase">　ボタン配置</span>
            <div className="flex bg-slate-900 rounded-lg p-1 border border-slate-700">
              {[
                { id: "positive", label: "＋" },
                { id: "negative", label: "－" },
                { id: "both", label: "＋/－" }
              ].map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setHabitType(h.id)}
                  className={`px-3 py-1 rounded text-[10px] font-bold transition-all ${
                    habitType === h.id ? "bg-purple-700 text-white shadow-inner scale-95" : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {h.label}
                </button>
              ))}
            </div>
          </div>
        )}

      {/* 🌿 日課の場合の曜日選択 */}
      {selectedType === "daily" && (
        <div className="w-full flex flex-col gap-2 animate-in fade-in slide-in-from-left-2 duration-200 mt-1">
          <span className="text-[12px] text-slate-500 font-black uppercase ml-1">実行する曜日</span>
          <div className="flex justify-between bg-slate-900 rounded-xl p-1 border border-slate-700">
            {[
              { id: 1, label: "月" },
              { id: 2, label: "火" },
              { id: 3, label: "水" },
              { id: 4, label: "木" },
              { id: 5, label: "金" },
              { id: 6, label: "土" },
              { id: 0, label: "日" },
            ].map((day) => {
              const isSelected = targetDays.includes(day.id);
              return (
               <button
                  key={day.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      // すでに選ばれていたら外す（ただし全部外れるのは防ぐと安全かも）
                      setTargetDays(targetDays.filter(d => d !== day.id));
                    } else {
                      // 選ばれていなければ追加する
                      setTargetDays([...targetDays, day.id]);
                    }
                  }}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-bold transition-all ${
                    isSelected 
                      ? "bg-purple-700 text-white shadow-inner scale-95" 
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

        {selectedType === "todo" && (
          <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-1.5 rounded-lg border border-slate-700 animate-in fade-in slide-in-from-left-2 duration-200">
            <span className="text-[10px] text-slate-500 font-black uppercase">期日</span>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              /* - color-scheme-dark: ブラウザ標準のカレンダーアイコンを白くする魔法
                - text-white: 文字をハッキリ白にする
              */
              className="bg-transparent text-[10px] text-white focus:outline-none [color-scheme:dark] font-mono cursor-pointer"
            />
          </div>
        )}
      </div>
      
      {/* --- 🧠 Grit Calculator Area --- */}
      <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-700 space-y-4">
        {/* 時間(T)スライダー */}
        <div className="space-y-1">
          <div className="flex justify-between text-[13px] font-black text-slate-500 uppercase">
            <span>⌛ 所要時間 (Time)</span>
            <span className="text-blue-400">{calcParams.t * 5}分</span>
          </div>
          <input 
            type="range" min="1" max="72" 
            value={calcParams.t} 
            onChange={(e) => setCalcParams({...calcParams, t: Number(e.target.value)})}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* D, S, I セレクター */}
        <div className="grid grid-cols-1 gap-3">
          <StatusButtonRow label="難易度 (D)" value={calcParams.d} settings={DIFF_SETTINGS} 
            onChange={(v) => setCalcParams({...calcParams, d: v})} />
          <StatusButtonRow label="精神的負荷 (S)" value={calcParams.s} settings={STRESS_SETTINGS} 
            onChange={(v) => setCalcParams({...calcParams, s: v})} />
          <StatusButtonRow label="重要度 (I)" value={calcParams.i} settings={IMPORTANCE_SETTINGS} 
            onChange={(v) => setCalcParams({...calcParams, i: v})} />
        </div>
      </div>

      {/* 報酬と担保（自動算出されるけど、手入力も可能） */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[13px] text-amber-500 font-black uppercase ml-1">🪙 報酬 (Reward)</label>
          <input 
            type="number" value={rewardGrit} onChange={(e) => setRewardGrit(Number(e.target.value))}
            className="w-full bg-slate-950 border border-amber-900/30 rounded-lg py-2 text-amber-400 font-mono text-center focus:ring-1 focus:ring-amber-500 outline-none"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[13px] text-red-500 font-black uppercase ml-1">⚖️ 担保 (Penalty)</label>
          <input 
            type="number" value={penaltyGrit} onChange={(e) => setPenaltyGrit(Number(e.target.value))}
            className="w-full bg-slate-950 border border-red-900/30 rounded-lg py-2 text-red-400 font-mono text-center focus:ring-1 focus:ring-red-500 outline-none"
          />
        </div>
      </div>

      {/* アクションボタン（省略せず実装） */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        {editingTask ? (
          <>
            <button onClick={deleteTask} className="bg-red-900/30 border border-red-500/50 text-red-400 py-3 rounded-xl font-black text-xs">削除</button>
            <button onClick={updateTask} className="bg-green-600 text-white py-3 rounded-xl font-black text-xs shadow-lg active:scale-95 transition-all">更新</button>
          </>
        ) : (
          <button onClick={addTask} className="col-span-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-black text-sm shadow-xl active:scale-95 transition-all">クエスト作成</button>
        )}
      </div>
    </div>
  );
}

// ✅ 1〜5の選択ボタンコンポーネント
function StatusButtonRow({ label, value, settings, onChange }: { label: string, value: number, settings: any[], onChange: (v: number) => void }) {
  const current = settings.find(s => s.val === value);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center px-1">
        <span className="text-[13px] text-slate-500 font-black uppercase">{label}</span>
        <span className="text-[13px] text-slate-300 font-bold">{current?.label} <span className="text-slate-500">({current?.desc})</span></span>
      </div>
      <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
        {settings.map((s) => (
          <button
            key={s.val}
            type="button"
            onClick={() => onChange(s.val)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all ${
              value === s.val ? "bg-slate-700 text-white shadow-lg" : "text-slate-600 hover:text-slate-400"
            }`}
          >
            {s.val}
          </button>
        ))}
      </div>
    </div>
  );
}