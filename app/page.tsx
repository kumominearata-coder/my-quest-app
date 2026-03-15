"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTasks } from "./hooks/useTasks";
import StatusBoard from "./components/StatusBoard";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import ReviewModal from "./components/ReviewModal";
import Toast from "./components/Toast";

export default function Home() {
  // 🧠 useTasksからロジックとデータベース操作関数をすべて取り出す
  const {
    grit, tasks, setTasks, isLoaded, activeTab, setActiveTab, tabs,
    reviewTasks, handleReviewFinish, updateHabitGrit, completeTask,
    toastMessage, showToast, setShowToast,
    addTask, updateTask, deleteTask // ←フック側で実装したこれらを受け取る
  } = useTasks();

  // フォームの状態管理
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [note, setNote] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [selectedType, setSelectedType] = useState("habit");
  const [selectedColor, setSelectedColor] = useState("#6366f1");
  const [selectedDiff, setSelectedDiff] = useState(2);
  const [habitType, setHabitType] = useState("positive");
  const [dueDate, setDueDate] = useState("");

  // 編集開始時の処理
  const startEditing = (task: any) => {
    setEditingTask(task);
    setNewTaskTitle(task.title);
    setNote(task.note || "");
    setTagsInput(task.tags ? task.tags.join(", ") : "");
    setSelectedType(task.type);
    setSelectedColor(task.color);
    setSelectedDiff(task.difficulty);
    setHabitType(task.habit_type || "positive");
    setDueDate(task.due_date || "");
    setIsModalOpen(true);
  };

  // フォームを閉じる・リセット
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setNewTaskTitle("");
    setNote("");
    setTagsInput("");
    setDueDate("");
  };

  // タスク追加・更新・削除の実行（TaskFormに渡す用）
  const handleAddTask = async () => {
    const tagsArray = tagsInput ? tagsInput.split(",").map(t => t.trim()) : [];
    const minSortOrder = tasks.length > 0 ? Math.min(...tasks.map(t => t.sort_order || 0)) : 0;
    
    const success = await addTask({
      title: newTaskTitle, note, tags: tagsArray, type: selectedType,
      color: selectedColor, difficulty: selectedDiff, user_id: 1,
      is_completed: false, habit_type: habitType, due_date: dueDate || null,
      positive_count: 0, negative_count: 0, sort_order: minSortOrder - 1
    });
    if (success) closeModal();
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    const tagsArray = tagsInput ? tagsInput.split(",").map(t => t.trim()) : [];
    const success = await updateTask(editingTask.id, {
      title: newTaskTitle, note, tags: tagsArray, type: selectedType,
      color: selectedColor, difficulty: selectedDiff, habit_type: habitType,
      due_date: dueDate || null,
    });
    if (success) closeModal();
  };

  const handleDeleteTask = async () => {
    if (!editingTask || !confirm("このクエストを破棄するの？")) return;
    const success = await deleteTask(editingTask.id);
    if (success) closeModal();
  };

  const handleSwipe = (direction: number) => {
    const currentIndex = tabs.indexOf(activeTab);
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < tabs.length) {
      setActiveTab(tabs[nextIndex]);
    }
  };

  if (!isLoaded) return <div className="text-white text-center mt-20 font-bold">ロード中...</div>;

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-950 text-white pb-40 overflow-hidden relative">
      <StatusBoard grit={grit} />

      {reviewTasks.length > 0 && (
        <ReviewModal incompleteTasks={reviewTasks} onFinish={handleReviewFinish} />
      )}

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
              updateHabitGrit={updateHabitGrit} 
              setTasks={setTasks} 
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

{/* 修正：画面下部コンソールユニット（浮かせず下辺に完全固定） */}
      <div className="fixed bottom-0 left-0 right-0 z-[100]">
        {/* 背景にグラデーションを敷いて、リストの最後が透けて見えるようにするよ */}
        <div className="bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent pt-10 pb-0 px-1">
          <div className="relative flex items-center justify-between bg-slate-900/80 backdrop-blur-xl border border-white/5 rounded-2xl p-1.5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] h-14 max-w-md mx-auto">
            <div className="flex flex-1 justify-around items-center px-2">
              {tabs.map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`relative py-1 px-3 transition-all ${activeTab === tab ? "text-amber-400 font-black scale-105" : "text-slate-500 font-bold"}`}>
                  <span className="text-[13px] tracking-tighter">{tab === "habit" ? "習慣" : tab === "daily" ? "日課" : "To Do"}</span>
                  {activeTab === tab && <motion.div layoutId="activeTabIndicator" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />}
                </button>
              ))}
            </div>
            
            {/* ＋ボタン：少しだけ浮かせて「緊急起動ボタン」っぽさを維持 */}
            <button 
              onClick={() => { closeModal(); setIsModalOpen(true); }} 
              className="flex-shrink-0 w-14 h-14 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-[0_5px_20px_rgba(220,38,38,0.4)] flex items-center justify-center text-3xl font-light transition-all active:scale-90 border-b-4 border-red-800 relative z-[110]"
            >
              ＋
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md animate-in fade-in zoom-in duration-200">
            <TaskForm 
                newTaskTitle={newTaskTitle} setNewTaskTitle={setNewTaskTitle} 
                note={note} setNote={setNote} 
                tagsInput={tagsInput} setTagsInput={setTagsInput} 
                selectedType={selectedType} setSelectedType={setSelectedType}
                selectedColor={selectedColor} setSelectedColor={setSelectedColor}
                selectedDiff={selectedDiff} setSelectedDiff={setSelectedDiff}
                habitType={habitType} setHabitType={setHabitType}
                dueDate={dueDate} setDueDate={setDueDate}
                addTask={handleAddTask}
                updateTask={handleUpdateTask}
                deleteTask={handleDeleteTask}
                cancelEdit={closeModal}
                editingTask={editingTask}
            />
          </div>
        </div>
      )}

      <Toast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
    </main>
  );
}