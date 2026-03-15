"use client";
import { useState } from "react";

export default function ReviewModal({ incompleteTasks, onFinish }: any) {
  // 各タスクを「やってた（true）」か「サボった（false）」かを管理
  const [results, setResults] = useState<{ [key: string]: boolean }>(
    Object.fromEntries(incompleteTasks.map((t: any) => [t.id, false]))
  );

  const toggleTask = (id: string) => {
    setResults((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = () => {
    onFinish(results);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-800 border-2 border-amber-500/50 rounded-3xl p-6 shadow-[0_0_30px_rgba(245,158,11,0.2)]">
        <h2 className="text-xl font-black text-amber-500 mb-2 flex items-center gap-2">
          <span>🌅</span> 朝の反省会
        </h2>
        <p className="text-slate-400 text-xs mb-6">
          朝5時を過ぎたよ。昨日の日課や期限切れのToDoをチェックしてね。
        </p>

        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 mb-6 custom-scrollbar">
          {incompleteTasks.map((task: any) => (
            <div
              key={task.id}
              onClick={() => toggleTask(task.id)}
              className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex justify-between items-center ${
                results[task.id]
                  ? "border-green-500 bg-green-500/10"
                  : "border-slate-700 bg-slate-900/50"
              }`}
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {/* タスクタイプごとのバッジ */}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${
                    task.type === "todo" 
                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
                      : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  }`}>
                    {task.type}
                  </span>
                  <span className="font-bold text-white leading-tight">{task.title}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 uppercase font-black">
                    Diff: {task.difficulty}
                  </span>
                  {task.due_date && (
                    <span className="text-[10px] text-red-400 font-black">
                      Deadline: {task.due_date}
                    </span>
                  )}
                </div>
              </div>

              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                results[task.id] ? "bg-green-500 border-green-500" : "border-slate-600"
              }`}>
                {results[task.id] && <span className="text-white text-xs">✔</span>}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-amber-600 hover:bg-amber-500 text-white py-4 rounded-2xl font-black text-sm shadow-lg transition-all active:scale-95"
        >
          報告を完了して一日を始める
        </button>
      </div>
    </div>
  );
}