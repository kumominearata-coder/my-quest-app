"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";

export function SortableTaskItem({ id, task, onEdit, completeTask, skipTask, updateHabitGrit }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  // 今日の曜日を取得（0:日 〜 6:土）
  const today = new Date().getDay();

  // 曜日タスクの「今日はお休み」判定
  // 日課タスクである & 曜日設定が存在 & 今日の曜日が含まれていない場合
  const isOffDay = task.type === "daily" && 
                   task.target_days && 
                   !task.target_days.includes(today);

  // 表示用の透明度と操作権限を計算
  // すでに完了しているか、今日がお休みなら薄くする
  const isInactive = task.is_completed || isOffDay;
  const itemOpacity = isInactive ? "opacity-40" : "opacity-100";
  const pointerEvents = "pointer-events-auto";
  
  // --- 【5段階のシステム安定度：色の定義】 ---
  const getStabilityConfig = (level: number) => {
    switch (level) {
      case 5: return { color: "text-cyan-400", border: "border-cyan-500/80", glow: "shadow-[0_0_50px_rgba(34,211,238,0.3)]" };
      case 4: return { color: "text-emerald-400", border: "border-emerald-500/80", glow: "shadow-[0_0_50px_rgba(52,211,153,0.2)]" };
      case 3: return { color: "text-yellow-400", border: "text-yellow-400/80", glow: "shadow-[0_0_50px_rgba(250,204,21,0.15)]" };
      case 2: return { color: "text-orange-400", border: "border-orange-500/80", glow: "shadow-[0_0_50px_rgba(249,115,22,0.15)]" };
      case 1: return { color: "text-rose-500", border: "border-rose-600/80", glow: "shadow-[0_0_50px_rgba(225,29,72,0.4)]" };
      default: return { color: "text-zinc-500", border: "border-zinc-700", glow: "" };
    }
  };

  const config = getStabilityConfig(task.stability);

  // 習慣タスクの表示判定
  const showPlus = task.type === "habit" && (task.habit_type === "positive" || task.habit_type === "both" || !task.habit_type);
  const showMinus = task.type === "habit" && (task.habit_type === "negative" || task.habit_type === "both");

  // 背景色の決定
  const backgroundColor = (isOffDay || task.is_completed) ? "#111113" : "#09090b";

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 100 : 1,
    backgroundColor: backgroundColor
  };

  const glitchAnimation = (task.stability === 1 && !task.is_completed) ? {
    x: [0, -2, 2, -1, 0],
    transition: { duration: 0.2, repeat: Infinity, repeatDelay: Math.random() * 5 + 2 }
  } : {};

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      animate={glitchAnimation}
      onClick={() => onEdit(task)}
      className={`relative pt-2 pb-2 px-2.5 rounded-xl border transition-all cursor-pointer overflow-hidden flex items-center gap-2 ${
        (task.is_completed || isOffDay) ? "border-zinc-800 opacity-40" : `hover:border-zinc-500 ${config.border} ${config.glow}`} ${itemOpacity} ${pointerEvents}`}
    >
      {/* 演出：スキャンライン */}
      {!task.is_completed && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      )}

      {/* ドラッグハンドル */}
      <div {...attributes} {...listeners} onClick={(e) => e.stopPropagation()} className="cursor-grab p-1 text-white/10 hover:text-white/40 z-10">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {/* 報酬と担保の表示 */}
      <div className="flex-1 flex justify-between items-center gap-3 z-10">
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex gap-2 items-center text-[11px] font-black tracking-widest font-mono">
            <div className="px-1.5 py-0.5 rounded-sm border border-white/5 bg-zinc-900/80 flex gap-1.5">
              <span className="text-amber-400">＋{task.reward_grit || 0}</span>
              <span className="text-zinc-600">/</span>
              <span className="text-red-400">－{task.penalty_grit || 0}</span>
            </div>
            {task.type === "todo" && task.due_date && (
              <span className="px-1.5 py-0.5 rounded-sm border border-red-900/30 bg-red-950/20 text-red-400 uppercase">
                LMT: {task.due_date}
              </span>
            )}
          </div>

          {/* タイトル */} 
          <span className={`font-bold text-[17px] leading-tight ${task.is_completed ? "line-through text-zinc-700" : (isOffDay ? "text-zinc-600" : "text-zinc-100")}`}>
            {task.title} 
          </span>

          {/* 概要欄 */}
          {task.note && (
            <p className="text-[12.5px] text-zinc-400 line-clamp-3 mt-0.5 leading-relaxed whitespace-pre-wrap">
              {task.note}
            </p>
          )}

          {/* タグ */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {task.tags.map((tag: string) => (
                <span key={tag} className="text-[9px] font-medium text-zinc-400 bg-zinc-800/50 px-1.5 py-0.5 rounded border border-zinc-700/50">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 右側：アクションボタン */}
        <div className="flex gap-2 items-center shrink-0" onClick={(e) => e.stopPropagation()}>
         {isOffDay ? (
           // 指定曜日外（OFF）の場合の表示
           <div className="px-2 py-1.5 text-[13px] font-black font-mono text-zinc-500 tracking-widest border border-zinc-700 rounded bg-zinc-900/50 select-none">
             OFF
           </div>

          // 習慣タスク
          ) : task.type === "habit" ? (
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center w-9">
                {showPlus ? (
                  <>
                    <span className="text-[11px] font-mono text-zinc-500">{task.positive_count || 0}</span>
                    <button onClick={() => updateHabitGrit(task, "plus")} className={`w-9 h-9 rounded border ${config.border} bg-zinc-900 flex items-center justify-center font-bold ${config.color} hover:bg-zinc-800 transition-all`}>＋</button>
                  </>
                ) : (
                  <div className="w-9 h-12" />
                )}
              </div>
              
              <div className="flex flex-col items-center w-9">
                {showMinus ? (
                  <>
                    <span className="text-[11px] font-mono text-zinc-500">{task.negative_count || 0}</span>
                    <button onClick={() => updateHabitGrit(task, "minus")} className="w-9 h-9 rounded border border-zinc-700 bg-zinc-900 flex items-center justify-center font-bold text-zinc-500 hover:bg-zinc-800 transition-all">－</button>
                  </>
                ) : (
                  <div className="w-9 h-12" />
                )}
              </div>
            </div>
          ) : (

          <div className="flex items-center gap-2.5">

          {/* 日課で未完了の時だけスキップボタンを表示 */}
          {task.type === "daily" && !task.is_completed && (
           <button
             onClick={() => skipTask(task)}
             className="text-[10px] font-black text-zinc-600 hover:text-zinc-400 px-2 py-1 border border-zinc-800 rounded uppercase tracking-tighter transition-colors"
            >
             Skip
            </button>
           )}

           {/* 既存の完了ボタン */}
            <button
              onClick={() => completeTask(task)}
              disabled={task.is_completed}
              className={`w-8 h-8 rounded border-3 flex items-center justify-center transition-all duration-500 ${
                task.is_completed 
                ? "border-zinc-800 bg-zinc-800 text-zinc-500" 
                : `${config.border} bg-transparent ${config.color} hover:scale-105 ${config.glow}`
              }`}
            >
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}