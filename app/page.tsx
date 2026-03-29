"use client"; // このファイルはブラウザ側で動くよ、という宣言

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion"; // アニメーション担当
import { useTasks } from "./hooks/tasks/useTasks"; // ロジックを呼び出す
import StatusBoard from "./components/StatusBoard"; // 上のステータス画面
import TaskModal from "./components/tasks/TaskModal"; // 入力フォーム
import TaskList from "./components/tasks/TaskList"; // タスクのリスト表示
import ReviewModal from "./components/tasks/ReviewModal"; // 朝の反省会モーダル
import Toast from "./components/Toast"; // ポップアップ通知
import GameHub from "./components/game/GameHub"; // ゲーム画面をインポート
import SettingsView from "./components/SettingsView"; // 設定画面をインポート

export default function Home() {
  // ---------------------------------------------------------
  // 🧠 【心臓部との接続】
  // useTasks.ts（別ファイル）で作ったデータや関数をここで使えるように借りてくる
  // ---------------------------------------------------------
  const {
    isLoaded,                    // データの読み込みが終わったかどうかの旗
    grit,                        // おにいの現在のポイント（Grit）
    tasks, setTasks,             // タスクのリスト本体とタスクを書き換えるための道具
    activeTab, setActiveTab, // 今「日課」とか「ToDo」とか、どのタブを見てるかと見るタブを切り替えるための道具
    tabs,                    // タブの名前リスト ["habit", "daily", "todo"]
    reviewTasks,             // 朝の反省会が必要なタスクたち（これがあるとモーダルが出る）
    handleReviewFinish,      // 反省会が終わった時に実行される処理
    updateHabitGrit,         // 習慣の＋ーを押した時の処理
    completeTask, skipTask, failTask, // タスクを完了･スキップ･失敗した時の処理
    toastMessage,                     // 通知に出すメッセージ
    showToast, setShowToast,          // 通知を今出しているかどうかの旗と、通知の表示・非表示を切り替える道具
    addTask, updateTask, deleteTask,  // タスクの追加・編集・消去
    rewardPopup, setRewardPopup,      // ポップアップ表示
    deleteConfirm, setDeleteConfirm, askDeleteTask //タスクの削除確認
  } = useTasks();

  // ---------------------------------------------------------
  // 📝 【フォームの状態管理】
  // 入力画面で「いま何を書いてるか」を一時的にメモしておく場所。<型：ルール決め>(初期値);が基本構造。
  // ---------------------------------------------------------
  const [viewMode, setViewMode] = useState<'task' | 'game' | 'settings'>('task'); //今どの画面にいるか
  const [isModalOpen, setIsModalOpen] = useState(false); // 入力画面を開いてるか
  const [editingTask, setEditingTask] = useState<any | null>(null); // 編集中のタスク（新規ならnull）
  const [formData, setFormData] = useState({ // 📋 タスクのデータをひとつの下書きオブジェクトに
    title: "",
    note: "",
    tagsInput: "",
    type: "daily",
    rewardGrit: 0,
    penaltyGrit: 0,
    minutes: 30,
    habitType: "positive",
    dueDate: "",
    targetDays: [0, 1, 2, 3, 4, 5, 6],
    calcParams: { t: 6, d: 3, s: 2, i: 2 }
  });

  // ⏳ 読み込み中は「ロード中」だけ出す
  if (!isLoaded) return <div className="text-white text-center mt-20 font-bold">ロード中...</div>;

  // 📱 【スワイプ操作】左右にスワイプとするとタブが切り替わる
  const handleSwipe = (direction: number) => {
    const currentIndex = tabs.indexOf(activeTab);
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < tabs.length) {
      setActiveTab(tabs[nextIndex]);
    }
  };

  // 🖊️ 【タスク編集】選んだタスクの情報を、入力フォームに自動でセットして画面を開く
  const startEditing = (task: any) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      note: task.note || "",
      tagsInput: task.tags ? task.tags.join(", ") : "",
      type: task.type,
      rewardGrit: task.reward_grit || 0,
      penaltyGrit: task.penalty_grit || 0,
      minutes: task.minutes || 30,
      habitType: task.habit_type || "positive",
      dueDate: task.due_date || "",
      targetDays: task.target_days || [0, 1, 2, 3, 4, 5, 6],
      calcParams: { t: task.calc_t || 6, d: task.calc_d || 3, s: task.calc_s || 2, i: task.calc_i || 2 }
    });
    setIsModalOpen(true);
  };
  
  // ❌ 【右上×ボタン】入力フォームを閉じて、中身を全部カラッポにする
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setFormData({
      title: "",
      note: "",
      tagsInput: "",
      type: "daily",
      rewardGrit: 0,
      penaltyGrit: 0,
      minutes: 30,
      habitType: "positive",
      dueDate: "",
      targetDays: [0, 1, 2, 3, 4, 5, 6],
      calcParams: { t: 6, d: 3, s: 2, i: 2 }
    });
  };

  // 💾 【保存・更新・削除の実行】
  // フォームで書いた内容を、実際にデータベースに送る命令群
  // 💾 新規追加
  const handleAddTask = async () => {
    const tagsArray = formData.tagsInput ? formData.tagsInput.split(",").map(t => t.trim()) : [];
    const minSortOrder = tasks.length > 0 ? Math.min(...tasks.map(t => t.sort_order || 0)) : 0;
    const success = await addTask({
      title: formData.title, note: formData.note, tags: tagsArray, type: formData.type,
      reward_grit: formData.rewardGrit, penalty_grit: formData.penaltyGrit, 
      calc_t: formData.calcParams.t, calc_d: formData.calcParams.d, calc_s: formData.calcParams.s, calc_i: formData.calcParams.i,
      user_id: 1, is_completed: false, habit_type: formData.habitType, due_date: formData.dueDate || null, target_days: formData.targetDays,
      positive_count: 0, negative_count: 0, sort_order: minSortOrder - 1
    });
    if (success) closeModal();
  };

  // 💾 更新
  const handleUpdateTask = async () => {
    if (!editingTask) return;
    const tagsArray = formData.tagsInput ? formData.tagsInput.split(",").map(t => t.trim()) : [];
    const success = await updateTask(editingTask.id, {
      title: formData.title, note: formData.note, tags: tagsArray, type: formData.type,
      reward_grit: formData.rewardGrit, penalty_grit: formData.penaltyGrit, 
      calc_t: formData.calcParams.t, calc_d: formData.calcParams.d, calc_s: formData.calcParams.s, calc_i: formData.calcParams.i,
      habit_type: formData.habitType, due_date: formData.dueDate || null, target_days: formData.targetDays,
    });
    if (success) closeModal();
  };

  // 💾 削除
  const handleDeleteTask = async () => {
    if (!editingTask) return;
    askDeleteTask(editingTask);
    closeModal();
  };

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
            className="w-full flex-1 touch-none z-10" // スワイプを検知する範囲の指定
            drag="x" // スワイプできる方向を指定
            dragConstraints={{ left: 0, right: 0 }} // 引きずれるけど、指を離したら元の位置に戻ってくるようにする
            onDragEnd={(e, info) => { if (info.offset.x < -50) handleSwipe(1); if (info.offset.x > 50) handleSwipe(-1); }} // 指を離した瞬間に発動する計算式。50ピクセル以上のスワイプでタブ移動
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
                  failTask={failTask}
                  updateHabitGrit={updateHabitGrit} 
                  setTasks={setTasks} 
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* 🎮 画面下の操作パネル（タブ切り替えと＋ボタン） */}
          <div className="fixed bottom-0 left-0 right-0 z-[100]">
            <div className="bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pt-10 pb-2 px-4">
              <div className="relative max-w-md mx-auto flex items-end justify-between gap-4">
      
          {/* 📋 左側：タブ切り替えバー */}
          <div className="flex-1 flex items-center justify-around bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-2xl p-1.5 h-14">
             {tabs.map((tab) => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`relative py-1 px-3 transition-all ${activeTab === tab ? "text-amber-400 font-black scale-120" : "text-slate-500 font-bold"}`}>
                      <span className="text-[13px] tracking-tighter">{tab === "habit" ? "習慣" : tab === "daily" ? "日課" : "To Do"}</span>
                      {activeTab === tab && <motion.div layoutId="activeTabIndicator" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />}
                    </button>
                  ))}
                </div>
                
          {/* ➕ 右側：独立した赤いボタン */}
            <button 
              onClick={() => { closeModal(); setIsModalOpen(true); }} 
             className="flex-shrink-0 w-14 h-14 bg-red-600 hover:bg-red-500 text-white rounded-xl flex items-center justify-center text-3xl transition-all active:scale-90 border-b-4 border-red-800 shadow-lg"
            >＋
            </button>
         </div>
       </div>
      </div>
    </>

      /* viewMode が 'game' の時だけ表示される画面 */
      ) : viewMode === 'game' ? (
        <div className="w-full flex-1 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
          <GameHub grit={grit} onBack={() => setViewMode('task')} />
        </div>
      ) : (

      /* viewMode が 'settings' の時 */
      <div className="w-full flex-1 animate-in fade-in slide-in-from-right-4 duration-300">
        <SettingsView onBack={() => setViewMode('task')} />
      </div>
      )}

      {/* 🖼️ 【入力・編集モーダル】ボタンを押した時だけフワッと出てくるよ */}
      <TaskModal 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        editingTask={editingTask}
        formData={formData}
        setFormData={setFormData}
        onAdd={handleAddTask}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
      />

      {/* 🍞 画面上にひょこっと出る通知 */}
      <Toast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />

      {rewardPopup?.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }}
            className="bg-zinc-900 border-2 border-amber-500/50 p-6 rounded-2xl text-center shadow-[0_0_50px_rgba(245,158,11,0.2)]"
          >
            <h2 className="text-zinc-500 text-xs font-black tracking-widest mb-2 uppercase">Grit Acquired</h2>
            <div className="text-5xl font-black text-amber-400 mb-4 font-mono">
              +{rewardPopup.added}
            </div>
            <div className="text-zinc-400 text-sm border-t border-white/10 pt-4">
              Current Total: <span className="text-white font-bold">{rewardPopup.total}</span>
            </div>
            <button 
             onClick={() => setRewardPopup(null)}
              className="mt-6 px-8 py-2 bg-amber-500 text-black font-black rounded-lg hover:bg-amber-400 transition-colors"
            >
              ACKNOWLEDGE
            </button>
          </motion.div>
        </div>
      )}

      {deleteConfirm?.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90">
          <div className="bg-zinc-900 border-2 border-rose-600 p-6 rounded-xl max-w-xs w-full">
            <h2 className="text-rose-500 font-black mb-4 flex items-center gap-2">
              <span>⚠️</span> TERMINATE QUEST?
            </h2>
            <p className="text-zinc-300 text-sm mb-6 leading-relaxed">
              クエスト 「<span className="text-white font-bold">{deleteConfirm.title}</span>」 を破棄する？<br/>
              この操作は取り消せないよ。
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2 bg-zinc-800 text-zinc-400 rounded font-bold hover:bg-zinc-700"
              >
                CANCEL
              </button>
              <button 
                onClick={() => {
                  deleteTask(deleteConfirm.id);
                  setDeleteConfirm(null);
               }}
                className="flex-1 py-2 bg-rose-600 text-white rounded font-bold hover:bg-rose-500"
              >
                DELETE
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}