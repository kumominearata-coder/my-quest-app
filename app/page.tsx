"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import StatusBoard from "./components/StatusBoard";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import ReviewModal from "./components/ReviewModal";
import useSound from 'use-sound';

export default function Home() {
  const [grit, setGrit] = useState(0);
  const [tasks, setTasks] = useState<any[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [selectedType, setSelectedType] = useState("habit");
  const [selectedDiff, setSelectedDiff] = useState(2);
  const [selectedColor, setSelectedColor] = useState("#6366f1");
  const [note, setNote] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  
  const tabs = ["habit", "daily", "todo"];
  const [activeTab, setActiveTab] = useState("habit");
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [habitType, setHabitType] = useState("positive"); 
  const [dueDate, setDueDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewTasks, setReviewTasks] = useState<any[]>([]);

  // 🔊 SEの設定
  const [playCoin] = useSound('/sounds/coin.mp3');
  const [playGavel] = useSound('/sounds/gavel.mp3');

  const handleSwipe = (direction: number) => {
    const currentIndex = tabs.indexOf(activeTab);
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < tabs.length) {
      setActiveTab(tabs[nextIndex]);
    }
  };

useEffect(() => {
    async function fetchData() {
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", 1).single();
      if (profile) setGrit(profile.grit);
      
      const { data: taskList } = await supabase
        .from("tasks")
        .select("*")
        .order("sort_order", { ascending: true });
      
      if (!taskList) return;

      const now = new Date();
      const hour = now.getHours();
      const todayStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      const lastProcessDate = localStorage.getItem("lastProcessDate");

      // 【修正ポイント】完了したタスクがあるかどうかのチェックを削除
      // 純粋に「朝5時以降」かつ「今日まだこの処理をしていない」なら判定開始
      if (hour >= 5 && lastProcessDate !== todayStr) {
        // 未完了の日課
        const incompleteDailies = taskList.filter(t => t.type === "daily" && !t.is_completed);
        // 期限切れのToDo
        const overdueTodos = taskList.filter(t => 
          t.type === "todo" && !t.is_completed && t.due_date && t.due_date < todayStr
        );
        const allReviewTargets = [...incompleteDailies, ...overdueTodos];

        if (allReviewTargets.length > 0) {
          // やり残しがある場合のみ反省会
          setReviewTasks(allReviewTargets);
          setTasks(taskList);
          // ※ handleReviewFinish 内で日付を記録するのでここではまだ書かない
        } else {
          // やり残しがない（全部終わっているか、まだ一つも手をつけていない）なら
          // 静かに日課の「済」を外して、今日の日付を記録する
          await resetDailies(taskList, todayStr);
        }
      } else {
        setTasks(taskList);
      }
      setIsLoaded(true);
    }
    fetchData();
  }, []);

  // 引数に今日の日付を追加して、処理完了を記録するようにしたよ
  const resetDailies = async (currentTasks: any[], dateStr: string) => {
    await supabase.from("tasks").update({ is_completed: false }).eq("type", "daily");
    setTasks(currentTasks.map(t => 
      t.type === "daily" ? { ...t, is_completed: false } : t
    ));
    localStorage.setItem("lastProcessDate", dateStr);
  };

  const handleReviewFinish = async (results: { [key: string]: boolean }) => {
    let totalGritChange = 0;
    await Promise.all(reviewTasks.map(async (task) => {
      const gritValue = 10 * Math.pow(2, (task.difficulty || 2) - 1);
      if (results[task.id]) {
        totalGritChange += gritValue;
        if (task.type === "todo") await supabase.from("tasks").delete().eq("id", task.id);
      } else {
        totalGritChange -= gritValue;
      }
    }));

    const newGrit = grit + totalGritChange;
    await supabase.from("profiles").update({ grit: newGrit }).eq("id", 1);
    setGrit(newGrit);
    
    // 反省会が終わったら「今日の処理は完了」と記録
    const todayStr = new Date().toISOString().split('T')[0];
    localStorage.setItem("lastProcessDate", todayStr);

    alert(`反省会終了。合計で ${totalGritChange} Grit 変動したよ。`);
    setReviewTasks([]);
    const { data: updatedList } = await supabase.from("tasks").select("*").order("sort_order", { ascending: true });
    if (updatedList) {
      // リセット処理を呼び出す（日付記録込み）
      await resetDailies(updatedList, todayStr);
    }
  };

  const updateHabitGrit = async (task: any, direction: "plus" | "minus") => {
    if (direction === "plus") {
      playCoin();
    } else {
      playGavel();
    }

    const baseGrit = 10;
    const gritChange = baseGrit * Math.pow(2, (task.difficulty || 2) - 1);
    const isPlus = direction === "plus";
    const newGrit = isPlus ? grit + gritChange : grit - gritChange;
    
    const { error: pError } = await supabase.from("profiles").update({ grit: newGrit }).eq("id", 1);
    if (pError) return;

    const updateData = isPlus 
      ? { positive_count: (task.positive_count || 0) + 1 } 
      : { negative_count: (task.negative_count || 0) + 1 };

    const { error: tError } = await supabase.from("tasks").update(updateData).eq("id", task.id);
    
    if (!tError) {
      setGrit(newGrit);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updateData } : t));
    }
  };

  const addTask = async () => {
    if (!newTaskTitle) return;
    const tagsArray = tagsInput ? tagsInput.split(",").map(t => t.trim()) : [];
    const minSortOrder = tasks.length > 0 ? Math.min(...tasks.map(t => t.sort_order || 0)) : 0;
    const nextSortOrder = minSortOrder - 1;
    const { data, error } = await supabase.from("tasks").insert([{ 
      title: newTaskTitle, note, tags: tagsArray, type: selectedType, 
      color: selectedColor, difficulty: selectedDiff, user_id: 1,
      is_completed: false, habit_type: habitType, due_date: dueDate || null,
      positive_count: 0, negative_count: 0, sort_order: nextSortOrder 
    }]).select();
    if (!error && data) {
      setTasks([data[0], ...tasks]);
      closeModal();
    }
  };

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

  const updateTask = async () => {
    if (!editingTask) return;
    const tagsArray = tagsInput ? tagsInput.split(",").map(t => t.trim()) : [];
    const { error } = await supabase.from("tasks").update({
      title: newTaskTitle, note, tags: tagsArray, type: selectedType,
      color: selectedColor, difficulty: selectedDiff, habit_type: habitType,
      due_date: dueDate || null,
    }).eq("id", editingTask.id);
    if (!error) {
      setTasks(tasks.map(t => t.id === editingTask.id ? { ...t, title: newTaskTitle, note, tags: tagsArray, type: selectedType, color: selectedColor, difficulty: selectedDiff, habit_type: habitType, due_date: dueDate } : t));
      closeModal();
    }
  };

  const deleteTask = async () => {
    if (!editingTask || !confirm("このクエストを破棄するの？")) return;
    const { error } = await supabase.from("tasks").delete().eq("id", editingTask.id);
    if (!error) {
      setTasks(tasks.filter(t => t.id !== editingTask.id));
      closeModal();
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    resetForm();
  };

  const resetForm = () => {
    setNewTaskTitle("");
    setNote("");
    setTagsInput("");
    setHabitType("positive");
    setDueDate("");
  };

  const completeTask = async (task: any) => {
    playCoin();
    const baseGrit = 10;
    const earnedGrit = baseGrit * Math.pow(2, (task.difficulty || 2) - 1);
    const newGrit = grit + earnedGrit;
    const { error: pError } = await supabase.from("profiles").update({ grit: newGrit }).eq("id", 1);
    if (pError) return;
    setGrit(newGrit);
    if (task.type === "todo") {
      const { error: dError } = await supabase.from("tasks").delete().eq("id", task.id);
      if (!dError) setTasks(tasks.filter((t) => t.id !== task.id));
    } else if (task.type === "daily") {
      const { error: uError } = await supabase.from("tasks").update({ is_completed: true }).eq("id", task.id);
      if (!uError) setTasks(tasks.map((t) => (t.id === task.id ? { ...t, is_completed: true } : t)));
    }
  };

  if (!isLoaded) return <div className="text-white text-center mt-20 font-bold">ロード中...</div>;

  return (
    <main className="flex min-h-screen flex-col items-center bg-slate-950 text-white pb-32 overflow-hidden relative">
      <StatusBoard grit={grit} />

      {reviewTasks.length > 0 && (
        <ReviewModal incompleteTasks={reviewTasks} onFinish={handleReviewFinish} />
      )}

      <motion.div 
        className="w-full flex-1 touch-none z-10" 
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={(e, info) => {
          if (info.offset.x < -50) handleSwipe(1);
          if (info.offset.x > 50) handleSwipe(-1);
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full px-4 pt-4"
          >
            <TaskList 
              tasks={tasks} activeTab={activeTab} setActiveTab={setActiveTab}
              onEdit={startEditing} completeTask={completeTask}
              updateHabitGrit={updateHabitGrit} setTasks={setTasks}
            />
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-md z-[100]">
        <div className="relative flex items-center justify-between bg-slate-800/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl h-16">
          <div className="flex flex-1 justify-around items-center px-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative py-1 px-3 transition-all ${
                  activeTab === tab ? "text-amber-400 font-black scale-110" : "text-slate-400 font-bold"
                }`}
              >
                <span className="text-[13px] tracking-wider">
                  {tab === "habit" ? "習慣" : tab === "daily" ? "日課" : "To Do"}
                </span>
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTabIndicator" 
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-amber-400 rounded-full" 
                  />
                )}
              </button>
            ))}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation(); 
              resetForm(); 
              setIsModalOpen(true); 
            }}
            className="flex-shrink-0 w-16 h-16 bg-red-600 hover:bg-red-500 text-white rounded-2xl shadow-[0_8px_25px_rgba(220,38,38,0.5)] flex items-center justify-center text-4xl font-light transition-all hover:scale-110 active:scale-95 border-b-4 border-red-800 translate-x-2 -translate-y-2 relative z-[110]"
          >
            ＋
          </button>
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
              addTask={addTask} editingTask={editingTask} 
              updateTask={updateTask} deleteTask={deleteTask} cancelEdit={closeModal}
            />
          </div>
        </div>
      )}
    </main>
  );
}