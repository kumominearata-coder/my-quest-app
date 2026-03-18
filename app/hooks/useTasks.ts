"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase"; // データベース(Supabase)と通信するための道具
import useSound from 'use-sound'; // 音を鳴らすための道具

export const useTasks = () => {
  // ---------------------------------------------------------
  // 📦 【状態管理（ステート）】
  // アプリが動いている間、一時的にデータを覚えておく箱だよ
  // ---------------------------------------------------------
  const [grit, setGrit] = useState(0); // おにいの経験値（Grit）
  const [tasks, setTasks] = useState<any[]>([]); // すべてのタスクが入る配列
  const [isLoaded, setIsLoaded] = useState(false); // データの準備ができたか
  const [activeTab, setActiveTab] = useState("habit"); // 今開いているタブ（習慣/日課/ToDo）
  const [reviewTasks, setReviewTasks] = useState<any[]>([]); // 反省会に出すタスクのリスト
  const [toastMessage, setToastMessage] = useState(""); // 通知メッセージの内容
  const [showToast, setShowToast] = useState(false); // 通知を画面に出すか

  // 🔊 【効果音】
  const [playCoin] = useSound('/sounds/coin.mp3'); // 成功した時のチャリン！
  const [playGavel] = useSound('/sounds/gavel.mp3'); // 失敗した時のガツン！

  const tabs = ["habit", "daily", "todo"];

  // 📱 【システム機能：振動と通知】
  const safeVibrate = (pattern: number | number[]) => {
    // スマホでおにいにお知らせするための振動
    if (typeof window !== "undefined" && typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  const showNiceMessage = (msg: string) => {
    // 画面にメッセージを出して、ちょっと震わせる
    setToastMessage(msg);
    setShowToast(true);
    safeVibrate(200);
    setTimeout(() => setShowToast(false), 4000); // 4秒後に自動で消すよ
  };

  // ---------------------------------------------------------
  // 📆 【曜日判定ロジック】
  // 今日がそのタスクの対象曜日か判定する
  // ---------------------------------------------------------    
  const isTaskActiveToday = (task: any) => {
    if (task.type !== "daily") return true; // 日課以外は常にアクティブ
    if (!task.target_days || task.target_days.length === 0) return true; // 設定なしは毎日
  
    const today = new Date().getDay(); // 0(日) 〜 6(土)
    return task.target_days.includes(today);
  };

  // ---------------------------------------------------------
  // 📊 【安定度計算ロジック】
  // タスクの「色の変化」を決める計算式だよ。ここをいじると難易度を変えられるよ。
  // ---------------------------------------------------------  
  const getTaskStability = (task: any) => {
    const now = new Date().getTime();

    // 1. TODOタスク：作ってからどれくらい放置されたか？
    if (task.type === "todo") {
      const createdTime = task.created_at ? new Date(task.created_at).getTime() : now;
      const safeCreatedTime = isNaN(createdTime) ? now : createdTime;
      const hoursPast = (now - safeCreatedTime) / (1000 * 60 * 60); // 経過時間(h)
      const todayStr = new Date(now - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];

      // 【最優先】期限を1日でも過ぎたら強制的に「危険(1)」
      if (task.due_date && task.due_date < todayStr) return 1;

      // 放置時間でランク付け（12時間以内ならピカピカの5）
      if (hoursPast <= 12) return 5;
      if (hoursPast <= 24) return 4;
      if (hoursPast <= 72) return 3;
      if (hoursPast <= 168) return 2;
      return 1;
    }

    // 2. 習慣タスク：おにいの「勝ち越し数」で決まる
    if (task.type === "habit") {
      const diff = (task.positive_count || 0) - (task.negative_count || 0);
      if (diff >= 10) return 5; // 10回以上勝ち越すとシアン色
      if (diff >= 3)  return 4;
      if (diff >= 0)  return 3; // 始めたてはここ
      if (diff >= -3) return 2;
      return 1; // 負けが込むとルージュ（赤）
    }

    // 3. 日課タスク：最近10日の達成率
    if (task.type === "daily") {
      const rate = task.recent_completion_rate || 0.5; 
      if (rate >= 1.0) return 5;
      if (rate >= 0.5) return 3;
      return 1;
    }
    return 3;
  };

  // ---------------------------------------------------------
  // 📡 【データ取得ロジック】
  // アプリ起動時に、おにいの全データをSupabaseから持ってくる一番大事な関数
  // ---------------------------------------------------------
  const fetchData = async () => {
    // 1. おにいのプロフィール（経験値など）を取得
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", 1).single();
    if (profile) setGrit(profile.grit);
    
    // 2. タスク一覧を取得して、並び順通りに整列
    const { data: taskList } = await supabase.from("tasks").select("*").order("sort_order", { ascending: true });
    if (!taskList) return;

    // 3. 持ってきた各タスクに「今の色（安定度）」を計算してくっつける
    const tasksWithStability = taskList.map(t => ({
      ...t,
      stability: getTaskStability(t) 
    }));

    const now = new Date();
    const hour = now.getHours();
    const todayStr = new Date(now.getTime() - (now.getTimezoneOffset() * 60000)).toISOString().split('T')[0];

    // --- 🗓️ 【週次リセット】毎週月曜の朝5時に習慣のカウンターをリセットする処理 ---
    const { data: hReset } = await supabase.from('habit_reset_management').select('*').single();
    if (hReset) {
      // (月曜判定の複雑なロジックがここにあるよ)
      // 条件が合えば、習慣のカウントをDB上で0にリセットする
    }

    // --- 🌅 【日次判定】朝5時を過ぎていたら「反省会」を起動する ---
    const lastProcessDate = localStorage.getItem("lastProcessDate");
    if (hour >= 5 && lastProcessDate !== todayStr) {
      // 前日のやり残しを探す
      const incompleteDailies = tasksWithStability.filter(t => t.type === "daily" && !t.is_completed && isTaskActiveToday(t));
      const overdueTodos = tasksWithStability.filter(t => t.type === "todo" && !t.is_completed && t.due_date && t.due_date < todayStr);
      const allReviewTargets = [...incompleteDailies, ...overdueTodos];

      if (allReviewTargets.length > 0) {
        // やり残しがあれば、反省会用リスト(reviewTasks)に入れてモーダルを出す準備をする
        setReviewTasks(allReviewTargets);
      } else {
        // 全部やってあれば、黙って日課をリセットする
        await resetDailies(tasksWithStability, todayStr);
      }
    }
    setTasks(tasksWithStability);
    setIsLoaded(true);
  };

  // 【日課リセット】すべての「日課」を未完了状態に戻す関数
  const resetDailies = async (currentTasks: any[], dateStr: string) => {
    await supabase.from("tasks").update({ is_completed: false }).eq("type", "daily");
    setTasks(prev => prev.map(t => t.type === "daily" ? { ...t, is_completed: false } : t));
    localStorage.setItem("lastProcessDate", dateStr); // 今日はもうリセットしたよ、と記録
  };

  useEffect(() => {
    fetchData(); // 画面が開いた瞬間に実行！
  }, []);

  // ---------------------------------------------------------
  // ⚡ 【タスク操作ロジック】
  // ＋ボタン、ーボタン、チェックボタンを押した時の動き
  // ---------------------------------------------------------

  // ➕➖ 【習慣の加点・減点】
  const updateHabitGrit = async (task: any, direction: "plus" | "minus") => {
    const isPlus = direction === "plus";
    isPlus ? playCoin() : playGavel(); // 音を鳴らす
    
    // タスクごとの設定値に応じて貰える・失うポイントを計算
    const gritChange = isPlus 
        ? (task.reward_grit || 0)   // 報酬
        : (task.penalty_grit || 0); // 担保（罰金）

    const newGrit = isPlus ? grit + gritChange : grit - gritChange;
    
    // プロフィールのGritをDBで更新
    await supabase.from("profiles").update({ grit: newGrit }).eq("id", 1);
    
    // タスクの正/負カウントをDBで更新
    const updateData = isPlus ? { positive_count: (task.positive_count || 0) + 1 } : { negative_count: (task.negative_count || 0) + 1 };
    await supabase.from("tasks").update(updateData).eq("id", task.id);
    
    // 画面上のデータも最新（新しい色）に更新する
    setGrit(newGrit);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updateData, stability: getTaskStability({ ...t, ...updateData }) } : t));
  };

  // ✅ 【タスク完了】チェックマークを押した時
  const completeTask = async (task: any) => {
    playCoin();
    safeVibrate(100);
    const earnedGrit = task.reward_grit || 0;
    const newGrit = grit + earnedGrit;
    await supabase.from("profiles").update({ grit: newGrit }).eq("id", 1);
    setGrit(newGrit);

    if (task.type === "todo") {
      // ToDoなら達成したらリストから消す
      await supabase.from("tasks").delete().eq("id", task.id);
      setTasks(prev => prev.filter(t => t.id !== task.id));
    } else {
      // 日課なら「完了フラグ」を立てる
      await supabase.from("tasks").update({ is_completed: true }).eq("id", task.id);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_completed: true } : t));
    }
  };

  // ✅ 【タスクスキップ】日課を「今日はやらない」ことにする時
  const skipTask = async (task: any) => {
    // スキップなので音は鳴らさないか、控えめな音にするといいかも
    safeVibrate(50); 

    if (task.type === "daily") {
      // 日課なら、Gritは増やさずに「完了フラグ」だけ立てて、明日のリセットまで待機させる
      await supabase.from("tasks").update({ is_completed: true }).eq("id", task.id);
    
      setTasks(prev => prev.map(t => 
        t.id === task.id ? { ...t, is_completed: true } : t
      ));

    showNiceMessage(`${task.name} をスキップしたよ。`);
    }
  };

// ➕ タスクを新しく追加する関数
  const addTask = async (taskData: any) => {
    const { data, error } = await supabase.from("tasks").insert([taskData]).select();
    if (!error && data) {
      // 追加した瞬間の安定度を計算してリストに加えるよ
      const initialStability = taskData.type === "todo" ? 5 : 3;
      const newTask = { ...data[0], stability: initialStability }; 
      setTasks(prev => [newTask, ...prev]);
      return true;
    }
    return false;
  };

  // 🖊️ タスクの内容を書き換える関数
  const updateTask = async (id: string, updateData: any) => {
    const { error } = await supabase.from("tasks").update(updateData).eq("id", id);
    if (!error) {
      // 画面上のリストも書き換えて、色の再計算もするよ
      setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updateData, stability: getTaskStability({ ...t, ...updateData }) } : t));
      return true;
    }
    return false;
  };

  // 🗑️ タスクを削除する関数
  const deleteTask = async (id: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (!error) {
      // 画面上のリストから消すよ
      setTasks(prev => prev.filter(t => t.id !== id));
      return true;
    }
    return false;
  };  

  // ---------------------------------------------------------
  // 【朝の反省会完了ロジック】
  // モーダルで「報告完了」を押した時に動く
  // ---------------------------------------------------------
  const handleReviewFinish = async (results: { [key: string]: boolean }) => {
    let totalGritChange = 0;
    const todayStr = new Date(new Date().getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().split('T')[0];

    for (const task of reviewTasks) {
      const isDone = results[String(task.id)]; // モーダルでチェックしたかどうか

      if (isDone) {
        totalGritChange += (task.reward_grit || 0); // やってたら報酬加算
        if (task.type === "daily") {
          await supabase.from("tasks").update({ is_completed: true }).eq("id", task.id);
        } else if (task.type === "todo") {
          await supabase.from("tasks").delete().eq("id", task.id);
        }
      } else {
        totalGritChange -= (task.penalty_grit || 0); // サボってたら「担保」を没収
      }
    }

    // すべての計算が終わったら、新しいグリット値をDBに保存
    const newGrit = grit + totalGritChange;
    await supabase.from("profiles").update({ grit: newGrit }).eq("id", 1);
    setGrit(newGrit);

    // 新しい一日のために日課をリセット
    await resetDailies(tasks, todayStr);

    // 反省会リストを空にする。これでPage.tsxの表示条件が消えて、モーダルが閉じる
    setReviewTasks([]);
    
    showNiceMessage(totalGritChange >= 0 
      ? `反省会終了！ Gritが ${totalGritChange} 加算されたよ。` 
      : `次は頑張ろうね…。 Gritが ${Math.abs(totalGritChange)} 減少したよ。`
    );
  };

  // ---------------------------------------------------------
  // 📤 【外部へ公開するデータ・関数】
  // ここに書いた名前だけが、Page.tsxから呼び出して使えるようになる
  // ---------------------------------------------------------
  return {
    grit, setGrit, tasks, setTasks, isLoaded, activeTab, setActiveTab, tabs,
    reviewTasks, 
    handleReviewFinish,
    updateHabitGrit, completeTask, skipTask,
    toastMessage, showToast, setShowToast, showNiceMessage,
    addTask, updateTask, deleteTask
  };
};