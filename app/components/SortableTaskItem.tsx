"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function SortableTaskItem({ id, task, onEdit, completeTask, updateHabitGrit, getDiffLabel }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 100 : 1,
    backgroundColor: task.is_completed ? "#1e293b" : task.color || "#334155",
  };

  const diffInfo = getDiffLabel(task.difficulty);
  const showPlus = task.type === "habit" && (task.habit_type === "positive" || task.habit_type === "both" || !task.habit_type);
  const showMinus = task.type === "habit" && (task.habit_type === "negative" || task.habit_type === "both");

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => onEdit(task)}
      className={`p-4 rounded-xl shadow-lg border-l-4 border-black/20 transition-all cursor-pointer hover:brightness-110 active:scale-[0.98] flex items-center gap-3 ${
        task.is_completed ? "opacity-40 grayscale" : ""
      }`}
    >
      {/* 【ドラッグハンドル】 */}
      <div
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="cursor-grab active:cursor-grabbing p-1 text-white/40 hover:text-white/80 transition-colors"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {/* メインエリア（横並び） */}
      <div className="flex-1 flex justify-between items-center gap-4">
        
        {/* 左側：タイトル、期限、ノート、タグ（縦並び） */}
        <div className="flex-1 flex flex-col gap-2">
          
          {/* 上段：期限、難易度（横並び） */}
          <div className="flex gap-2 items-center text-[9px] font-black uppercase tracking-widest">
            <span className={`px-1.5 py-0.5 rounded border bg-black/20 ${diffInfo.color}`}>
              {diffInfo.text}
            </span>
            {task.type === "todo" && task.due_date && (
              <span className="text-red-200 bg-red-900/40 px-1.5 py-0.5 rounded border border-red-500/30">
                期限: {task.due_date}
              </span>
            )}
          </div>

          {/* 中段：タイトル */}
          <span className={`font-bold text-white drop-shadow-md text-base ${task.is_completed ? "line-through text-slate-400" : ""}`}>
            {task.title}
          </span>

          {/* 下段：ノート（あれば） */}
          {task.note && (
            <p className="text-[11px] text-slate-200 leading-relaxed whitespace-pre-wrap opacity-80 line-clamp-3">
              {task.note}
            </p>
          )}

          {/* 下段：タグ（あれば） */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {task.tags.map((tag: string) => (
                <span 
                  key={tag} 
                  className="text-[9px] font-bold text-slate-100 bg-white/10 px-1.5 py-0.5 rounded-full border border-white/10"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 右側：ボタンとカウンター部分 */}
        <div className="flex gap-3 items-center shrink-0" onClick={(e) => e.stopPropagation()}>
          {task.type === "habit" ? (
            <div className="flex items-center gap-3">
              {showPlus && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-white/70">{task.positive_count || 0}</span>
                  <button
                    onClick={() => updateHabitGrit(task, "plus")}
                    className="bg-white/20 hover:bg-white/40 w-10 h-10 rounded-full font-black text-xl flex items-center justify-center transition-all active:scale-90"
                  >＋</button>
                </div>
              )}
              {showMinus && (
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-bold text-white/70">{task.negative_count || 0}</span>
                  <button
                    onClick={() => updateHabitGrit(task, "minus")}
                    className="bg-black/30 hover:bg-black/50 w-10 h-10 rounded-full font-black text-xl flex items-center justify-center transition-all active:scale-90"
                  >－</button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => completeTask(task)}
              disabled={task.is_completed}
              className="bg-black/20 hover:bg-black/30 px-4 py-2 rounded-lg text-xs font-bold transition-all active:scale-95 disabled:opacity-50 text-white"
            >
              {task.is_completed ? "済" : "達成"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}