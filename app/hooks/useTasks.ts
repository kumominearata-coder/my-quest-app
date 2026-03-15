"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import useSound from 'use-sound';

export const useTasks = () => {
  const [grit, setGrit] = useState(0);
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("habit");
  const [reviewTasks, setReviewTasks] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  const [playCoin] = useSound('/sounds/coin.mp3');
  const [playGavel] = useSound('/sounds/gavel.mp3');

  const tabs = ["habit", "daily", "todo"];

  // --- 【システム：ここから】 ---
  // 振動機能：デバイスが対応してれば、おにいの手に「感触」を伝えるよ。
  const safeVibrate = (pattern: number | number[]) => {
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  // 通知機能：ディストピアな世界でも、私のアナウンスはちゃんと聞いてね。
  const showNiceMessage = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    safeVibrate(200);
    setTimeout(() => setShowToast(false), 4000);
  };
  // --- 【システム：ここまで】 ---


  // --- 【安定度計算ロジック：ここが今回の肝！】 ---
  // 1(危険:Rouge) ～ 5(最上:Cyan) の数値を返すよ。
  const getTaskStability = (task: any) => {
    const now = new Date().getTime();

// 1. TODOタスク：放置された時間で判定
if (task.type === "todo") {
      // 1. 作成日時を確実にパースする
      const createdTime = task.created_at ? new Date(task.created_at).getTime() : now;
      
      // 2. パースに失敗(NaN)したら、とりあえず「今作った」ことにして赤色化を防ぐ
      const safeCreatedTime = isNaN(createdTime) ? now : createdTime;
      
      const hoursPast = (now - safeCreatedTime) / (1000 * 60 * 60);
      
      // 3. 期限切れ判定用の文字列（JST基準）
      const todayStr = new Date(now - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];

      // 【最優先】期限が設定されていて、かつ今日を過ぎていたら赤
      if (task.due_date && task.due_date < todayStr) {
        return 1;
      }

      // 【鮮度判定】計算された hoursPast に基づいて判定
      // safeCreatedTime を使っているから、作成直後なら hoursPast は 0 に近くなるはずだよ
      if (hoursPast <= 12) return 5;
      if (hoursPast <= 24) return 4;
      if (hoursPast <= 72) return 3;
      if (hoursPast <= 168) return 2;
      return 1;
    }

    // 2. 習慣タスク：積み上げた功績（スコア差分）で判定
    if (task.type === "habit") {
      const diff = (task.positive_count || 0) - (task.negative_count || 0);
      if (diff >= 10) return 5;     // 10以上でシアン
      if (diff >= 3)  return 4;     // 3以上でエメラルド
      if (diff > 0)   return 3;     // 1〜2ならイエロー（※ここを調整）
      if (diff === 0) return 3;     // 0もイエロー（初期状態）
      if (diff >= -3) return 2;     // マイナスならオレンジ
      return 1;                     // それ以下はルージュ
    }

    // 3. 日課タスク：直近10日の達成率
    if (task.type === "daily") {
      // 本来は履歴DBを見るけど、今はtask内のrecent_rate(0~1.0)で計算する体にするよ。
      const rate = task.recent_completion_rate || 0.5; 
      if (rate >= 1.0) return 5;
      if (rate >= 0.8) return 4;
      if (rate >= 0.5) return 3;
      if (rate >= 0.3) return 2;
      return 1;
    }

    return 3; // 判定不能なら通常
  };
  // --- 【計算ロジック：ここまで】 ---


  const fetchData = async () => {
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", 1).single();
    if (profile) setGrit(profile.grit);
    
    const { data: taskList } = await supabase
      .from("tasks")
      .select("*")
      .order("sort_order", { ascending: true });
    
    if (!taskList) return;

    // 取得したタスクに「安定度ランク」を付与して保存するよ。
    const tasksWithStability = taskList.map(t => ({
      ...t,
      stability: getTaskStability(t) 
    }));

    const now = new Date();
    const hour = now.getHours();
    const todayStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

    // --- 習慣リセットロジック (毎週月曜 5:00) ---
    const { data: hReset } = await supabase.from('habit_reset_management').select('*').single();
    if (hReset) {
      const lastHabitReset = new Date(hReset.last_habit_reset_at);
      const day = now.getDay();
      const diffToMonday = (day === 0 ? 6 : day - 1);
      const targetMonday = new Date(now);
      targetMonday.setDate(now.getDate() - diffToMonday);
      targetMonday.setHours(5, 0, 0, 0);
      if (now < targetMonday) targetMonday.setDate(targetMonday.getDate() - 7);

      if (lastHabitReset < targetMonday) {
        await supabase.from("tasks").update({ positive_count: 0, negative_count: 0 }).eq("type", "habit");
        await supabase.from("habit_reset_management").update({ last_habit_reset_at: now.toISOString() }).eq("id", 1);
        tasksWithStability.forEach(t => { if (t.type === "habit") { t.positive_count = 0; t.negative_count = 0; } });
        showNiceMessage("新しい一週間の始まりだよ。\n習慣カウンターを清算しておいたからね。");
      }
    }

    // --- 日課リセット & 反省会判定 ---
    const lastProcessDate = localStorage.getItem("lastProcessDate");
    if (hour >= 5 && lastProcessDate !== todayStr) {
      const incompleteDailies = tasksWithStability.filter(t => t.type === "daily" && !t.is_completed);
      const overdueTodos = tasksWithStability.filter(t => t.type === "todo" && !t.is_completed && t.due_date && t.due_date < todayStr);
      const allReviewTargets = [...incompleteDailies, ...overdueTodos];

      if (allReviewTargets.length > 0) {
        setReviewTasks(allReviewTargets);
      } else {
        await resetDailies(tasksWithStability, todayStr);
      }
    }
    setTasks(tasksWithStability);
    setIsLoaded(true);
  };

  const resetDailies = async (currentTasks: any[], dateStr: string) => {
    await supabase.from("tasks").update({ is_completed: false }).eq("type", "daily");
    setTasks(prev => prev.map(t => t.type === "daily" ? { ...t, is_completed: false } : t));
    localStorage.setItem("lastProcessDate", dateStr);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- タスク完了/操作系のロジック ---

  const updateHabitGrit = async (task: any, direction: "plus" | "minus") => {
    const isPlus = direction === "plus";
    isPlus ? (playCoin(), safeVibrate(50)) : (playGavel(), safeVibrate([50, 50, 50]));
    
    const gritChange = 10 * Math.pow(2, (task.difficulty || 2) - 1);
    const newGrit = isPlus ? grit + gritChange : grit - gritChange;
    
    const { error: pError } = await supabase.from("profiles").update({ grit: newGrit }).eq("id", 1);
    if (pError) return;

    const updateData = isPlus ? { positive_count: (task.positive_count || 0) + 1 } : { negative_count: (task.negative_count || 0) + 1 };
    const { error: tError } = await supabase.from("tasks").update(updateData).eq("id", task.id);
    
    if (!tError) {
      setGrit(newGrit);
      // 更新後のデータでもう一度安定度を計算し直して画面をリフレッシュするよ。
      setTasks(prev => prev.map(t => {
        if (t.id === task.id) {
          const updatedTask = { ...t, ...updateData };
          return { ...updatedTask, stability: getTaskStability(updatedTask) };
        }
        return t;
      }));
    }
  };

  const completeTask = async (task: any) => {
    playCoin();
    safeVibrate(100);
    const earnedGrit = 10 * Math.pow(2, (task.difficulty || 2) - 1);
    const newGrit = grit + earnedGrit;
    await supabase.from("profiles").update({ grit: newGrit }).eq("id", 1);
    setGrit(newGrit);

    if (task.type === "todo") {
      await supabase.from("tasks").delete().eq("id", task.id);
      setTasks(prev => prev.filter(t => t.id !== task.id));
    } else {
      await supabase.from("tasks").update({ is_completed: true }).eq("id", task.id);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: true } : t));
    }
  };

  // --- 基本的なCRUD操作 ---
  const addTask = async (taskData: any) => {
    const { data, error } = await supabase.from("tasks").insert([taskData]).select();
    if (!error && data) {
      const initialStability = taskData.type === "todo" ? 5 : 3;
      
      const newTask = { ...data[0], stability: initialStability }; 
      setTasks(prev => [newTask, ...prev]);
      return true;
    }
    return false;
  };

  const updateTask = async (id: string, updateData: any) => {
    const { error } = await supabase.from("tasks").update(updateData).eq("id", id);
    if (!error) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updateData, stability: getTaskStability({ ...t, ...updateData }) } : t));
      return true;
    }
    return false;
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (!error) {
      setTasks(prev => prev.filter(t => t.id !== id));
      return true;
    }
    return false;
  };

  return {
    grit, setGrit, tasks, setTasks, isLoaded, activeTab, setActiveTab, tabs,
    reviewTasks, handleReviewFinish: (res: any) => {}, // 今回は省略
    updateHabitGrit, completeTask,
    toastMessage, showToast, setShowToast, showNiceMessage,
    addTask, updateTask, deleteTask
  };
};