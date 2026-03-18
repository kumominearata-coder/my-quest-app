"use client"; // このファイルはブラウザ側で動くよ、という宣言

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion"; // アニメーション担当
import { useTasks } from "./hooks/useTasks"; // 心臓部（ロジック）を呼び出すよ
import StatusBoard from "./components/StatusBoard"; // 上のステータス画面
import TaskForm from "./components/TaskForm"; // 入力フォーム
import TaskList from "./components/TaskList"; // タスクのリスト表示
import ReviewModal from "./components/ReviewModal"; // 朝の反省会モーダル
import Toast from "./components/Toast"; // ポップアップ通知
import GameHub from "./components/GameHub"; // これから作るゲーム画面をインポート

export default function Home() {

  // 🌿 今「タスク(task)」か「ゲーム(game)」どっちの画面にいるかを決める
  const [viewMode, setViewMode] = useState<'task' | 'game'>('task');

  // ---------------------------------------------------------
  // 🧠 【心臓部との接続】
  // useTasks.ts（別ファイル）で作ったデータや関数を、ここで使えるように借りてくるよ
  // ---------------------------------------------------------
  const {
    grit,           // おにいの現在のポイント（Grit）
    tasks,          // タスクのリスト本体
    setTasks,       // タスクを書き換えるための道具
    isLoaded,       // データの読み込みが終わったかどうかの旗
    activeTab,      // 今「日課」とか「ToDo」とか、どのタブを見てるか
    setActiveTab,   // 見るタブを切り替えるための道具
    tabs,           // タブの名前リスト ["habit", "daily", "todo"]
    reviewTasks,    // 【重要】朝の反省会が必要なタスクたち（これがあるとモーダルが出るよ）
    handleReviewFinish, // 【重要】反省会が終わった時に実行される処理
    updateHabitGrit,    // 習慣の＋ーを押した時の処理
    completeTask,       // タスクを完了させた時の処理
    skipTask,           // タスクをスキップした時の処理
    toastMessage,       // 通知に出すメッセージ
    showToast,          // 通知を今出しているかどうかの旗
    setShowToast,       // 通知の表示・非表示を切り替える道具
    addTask, updateTask, deleteTask // タスクの追加・編集・消去
  } = useTasks();

  // ---------------------------------------------------------
  // 📝 【フォームの状態管理】
  // 入力画面で「いま何を書いてるか」を一時的にメモしておく場所だよ
  // ---------------------------------------------------------
  const [isModalOpen, setIsModalOpen] = useState(false); // 入力画面を開いてるか
  const [editingTask, setEditingTask] = useState<any | null>(null); // 編集中のタスク（新規ならnull）
  const [newTaskTitle, setNewTaskTitle] = useState(""); // タイトル
  const [note, setNote] = useState(""); // メモ
  const [tagsInput, setTagsInput] = useState(""); // タグ
  const [selectedType, setSelectedType] = useState("habit"); // 習慣か日課かToDoか
  const [rewardGrit, setRewardGrit] = useState(10); // 報酬（）は初期値
  const [penaltyGrit, setPenaltyGrit] = useState(10); // 担保（）は初期値
  const [habitType, setHabitType] = useState("positive"); // 良い習慣か悪い習慣か
  const [dueDate, setDueDate] = useState(""); // 期限
  const [targetDays, setTargetDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]); // 日課の対象曜日

  // 🖊️ 【編集ボタンを押した時】
  // 選んだタスクの情報を、入力フォームに自動でセットして画面を開く
  const startEditing = (task: any) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNote(task.note || "");
    setTagsInput(task.tags ? task.tags.join(", ") : "");
    setSelectedType(task.type);
    setRewardGrit(task.reward_grit || 0);
    setPenaltyGrit(task.penalty_grit || 0); 
    setHabitType(task.habit_type || "positive");
    setDueDate(task.due_date || "");
    setTargetDays(task.target_days || [0, 1, 2, 3, 4, 5, 6]); 
    setIsModalOpen(true);
  };

  // ❌ 【閉じるボタンを押した時】
  // 入力フォームを閉じて、中身を全部カラッポにするよ
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setNewTaskTitle("");
    setNote("");
    setTagsInput("");
    setDueDate("");
    setTargetDays([0, 1, 2, 3, 4, 5, 6]); 
    setEditingTask(null);
  };

  // 💾 【保存・更新・削除の実行】
  // フォームで書いた内容を、実際にDB（データベース）に送る命令群

  // 💾 新規追加
  const handleAddTask = async () => {
    const tagsArray = tagsInput ? tagsInput.split(",").map(t => t.trim()) : [];
    const minSortOrder = tasks.length > 0 ? Math.min(...tasks.map(t => t.sort_order || 0)) : 0;
    
    const success = await addTask({
      title: newTaskTitle, note, tags: tagsArray, type: selectedType,
      reward_grit: rewardGrit, penalty_grit: penaltyGrit, user_id: 1,
      is_completed: false, habit_type: habitType, due_date: dueDate || null, target_days: targetDays,
      positive_count: 0, negative_count: 0, sort_order: minSortOrder - 1
    });
    if (success) closeModal();
  };

  // 💾 更新
  const handleUpdateTask = async () => {
    if (!editingTask) return;
    const tagsArray = tagsInput ? tagsInput.split(",").map(t => t.trim()) : [];
    const success = await updateTask(editingTask.id, {
      title: newTaskTitle, note, tags: tagsArray, type: selectedType,
      reward_grit: rewardGrit, penalty_grit: penaltyGrit, habit_type: habitType,
      due_date: dueDate || null, target_days: targetDays,
    });
    if (success) closeModal();
  };

    // 💾 削除
  const handleDeleteTask = async () => {
    if (!editingTask || !confirm("このクエストを破棄するの？")) return;
    const success = await deleteTask(editingTask.id);
    if (success) closeModal();
  };

  // 📱 【スワイプ操作】左右にシュッとするとタブが切り替わるよ
  const handleSwipe = (direction: number) => {
    const currentIndex = tabs.indexOf(activeTab);
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < tabs.length) {
      setActiveTab(tabs[nextIndex]);
    }
  };

  // ⏳ 読み込み中は「ロード中」だけ出すよ
  if (!isLoaded) return <div className="text-white text-center mt-20 font-bold">ロード中...</div>;

return (
    <main className="flex min-h-screen flex-col items-center bg-slate-950 text-white overflow-hidden relative">

      {/* 🌿 【重要】viewMode が 'task' の時（いつもの画面） */}
      {viewMode === 'task' ? (
        <>
      {/* 📊 ステータス表示（一番上のバー） */}
      <StatusBoard 
            grit={grit} 
            viewMode={viewMode} 
            onViewChange={setViewMode} 
          />

      {/* 🌅 【朝の反省会】対象タスクが1つでもある時だけ、最前面に表示するよ */}
      {reviewTasks.length > 0 && (
        <ReviewModal incompleteTasks={reviewTasks} onFinish={handleReviewFinish} />
      )}

      {/* 📜 タスクリスト本体（左右スワイプできるエリア） */}
      <motion.div 
        className="w-full flex-1 touch-none z-10" 
        drag="x" 
        dragConstraints={{ left: 0, right: 0 }} 
        onDragEnd={(e, info) => { if (info.offset.x < -50) handleSwipe(1); if (info.offset.x > 50) handleSwipe(-1); }}
      >
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="w-full px-4 pt-4">
            <TaskList 
              tasks={tasks} 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              onEdit={startEditing} 
              completeTask={completeTask} 
              skipTask={skipTask}
              updateHabitGrit={updateHabitGrit} 
              setTasks={setTasks} 
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* 🎮 画面下の操作パネル（タブ切り替えと＋ボタン） */}
      <div className="fixed bottom-0 left-0 right-0 z-[100]">
        <div className="bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pt-10 pb-0 px-1">
          <div className="relative flex items-center justify-between bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-t-2xl p-1.5 h-14 max-w-md mx-auto">
            {/* 各タブの切り替えボタン */}
            <div className="flex flex-1 justify-around items-center px-2">
              {tabs.map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`relative py-1 px-3 transition-all ${activeTab === tab ? "text-amber-400 font-black scale-105" : "text-slate-500 font-bold"}`}>
                  <span className="text-[13px] tracking-tighter">{tab === "habit" ? "習慣" : tab === "daily" ? "日課" : "To Do"}</span>
                  {activeTab === tab && <motion.div layoutId="activeTabIndicator" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />}
                </button>
              ))}
            </div>
            
            {/* ➕ 新しくクエストを作るための赤いボタン */}
            <button 
              onClick={() => { closeModal(); setIsModalOpen(true); }} 
              className="flex-shrink-0 w-14 h-14 bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center justify-center text-3xl transition-all active:scale-90 border-b-4 border-red-800 relative z-[110]"
            >
              ＋
            </button>
          </div>
        </div>
      </div>
</>
      ) : (
        /* viewMode が 'game' の時だけ表示される新しい画面 */
        <div className="w-full flex-1 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <GameHub grit={grit} onBack={() => setViewMode('task')} />
        </div>
      )}

      {/* 🖼️ 【入力・編集モーダル】ボタンを押した時だけフワッと出てくるよ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in fade-in zoom-in duration-200">
            <TaskForm 
                newTaskTitle={newTaskTitle} setNewTaskTitle={setNewTaskTitle} 
                note={note} setNote={setNote} 
                tagsInput={tagsInput} setTagsInput={setTagsInput} 
                selectedType={selectedType} setSelectedType={setSelectedType}
                rewardGrit={rewardGrit} setRewardGrit={setRewardGrit}
                penaltyGrit={penaltyGrit} setPenaltyGrit={setPenaltyGrit}
                habitType={habitType} setHabitType={setHabitType}
                dueDate={dueDate} setDueDate={setDueDate}
                targetDays={targetDays} setTargetDays={setTargetDays}
                addTask={handleAddTask}
                updateTask={handleUpdateTask}
                deleteTask={handleDeleteTask}
                cancelEdit={closeModal}
                editingTask={editingTask}
            />
          </div>
        </div>
      )}

      {/* 🍞 画面上にひょこっと出る通知 */}
      <Toast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
    </main>
  );
}