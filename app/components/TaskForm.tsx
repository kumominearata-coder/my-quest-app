"use client";

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

export default function TaskForm({
  newTaskTitle,
  setNewTaskTitle,
  note,
  setNote,
  tagsInput,
  setTagsInput,
  selectedType,
  setSelectedType,
  rewardGrit, setRewardGrit, 
  penaltyGrit, setPenaltyGrit,
  habitType,
  setHabitType,
  dueDate,
  setDueDate,
  targetDays,
  setTargetDays,
  addTask,
  editingTask,
  updateTask,
  deleteTask,
  cancelEdit,
}: TaskFormProps) {
  const difficulties = [
    { label: "Easy", value: 1, color: "text-blue-400" },
    { label: "Normal", value: 2, color: "text-green-400" },
    { label: "Hard", value: 3, color: "text-orange-400" },
    { label: "Lunatic", value: 4, color: "text-red-400" },
  ];

  return (
    <div className={`w-full max-w-md space-y-4 bg-slate-800 p-5 rounded-3xl border-2 transition-all shadow-2xl text-sm ${
      editingTask ? "border-purple-500 shadow-purple-500/20" : "border-slate-700 shadow-black/50"
    }`}>
      
      {/* ヘッダー部分：タイトルと閉じるボタン */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-700/50 mb-2">
        <h2 className="text-base font-black text-white flex items-center gap-2">
          <span className={`w-2 h-4 rounded-full ${editingTask ? "bg-purple-500" : "bg-red-500"}`}></span>
          {editingTask ? "クエスト編集" : "新規クエスト登録"}
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
        placeholder="タグ（カンマ区切り：勉強, 数学）"
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
      
      {/* 報酬と担保の設定エリア */}
      <div className="grid grid-cols-2 gap-3 bg-slate-900/50 p-3 rounded-2xl border border-slate-700/50">
        <div className="space-y-1.5">
          <label className="text-[12px] text-amber-400 uppercase font-black ml-1 flex items-center gap-1">
            <span>🪙</span> 報酬 (Reward)
          </label>
          <input 
            type="number"
            value={rewardGrit}
            onChange={(e) => setRewardGrit(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-center focus:ring-1 focus:ring-amber-500 outline-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[12px] text-red-400 uppercase font-black ml-1 flex items-center gap-1">
            <span>⚖️</span> 担保 (Penalty)
          </label>
          <input 
            type="number"
            value={penaltyGrit}
            onChange={(e) => setPenaltyGrit(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-center focus:ring-1 focus:ring-red-500 outline-none"
          />
        </div>
      </div>

      {/* アクションボタン */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        {editingTask ? (
          <>
            <button onClick={deleteTask} className="bg-red-900/30 border border-red-500/50 text-red-400 py-3 rounded-xl font-black text-xs hover:bg-red-900/50 transition-colors">削除</button>
            <button onClick={updateTask} className="bg-green-600 text-white py-3 rounded-xl font-black text-xs shadow-lg shadow-green-900/20 active:scale-95 transition-all">更新</button>
          </>
        ) : (
          <button 
            onClick={addTask} 
            className="col-span-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-xl font-black text-sm shadow-xl shadow-purple-900/20 active:scale-[0.98] transition-all"
          >
            作成
          </button>
        )}
      </div>
    </div>
  );
}