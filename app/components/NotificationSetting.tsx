// app/components/NotificationSetting.tsx
"use client";

import { useState } from "react";
import { subscribeToPush } from "@/app/utils/pushNotification";
import { createBrowserClient } from "@supabase/ssr";

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

export default function NotificationSetting() {
  const [loading, setLoading] = useState(false);

  const handleEnableNotification = async () => {
    setLoading(true);
  
  // 🌿 【テスト用】もしログインしてなければ、自動でログインを試みる（開発中だけ！）
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    const { error } = await supabase.auth.signInWithPassword({
      email: 'kumomine.arata@gmail.com',
      password: 'isomer31415',
    });
    if (error) {
      alert("ログインに失敗したよ: " + error.message);
      setLoading(false);
      return;
    }
  }

    try {
      // ここで getUser() を呼ぶ前にログを出してみる
      console.log("ユーザー情報を確認中...");
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.error("ユーザー取得失敗:", userError);
        alert("ログイン状態が不安定みたい。一度ページをリロードしてみて？");
        return;
      }
      console.log("ログインユーザー確認OK:", user.id);

      // 1. ブラウザから購読情報を取得
      const subscription = await subscribeToPush();

      if (!subscription) {
        alert("通知の許可がもらえなかったよ。設定を確認してみてね。");
        return;
      }

      // JSONに変換して扱いやすくする
      const sub = subscription.toJSON();

      // 2. Supabase の push_subscriptions テーブルに保存
      // user_id は Supabase Auth が自動で判別してくれるはず
      
      if (!user) {
        alert("ログインしていないみたい。先にログインしてね。");
        return;
      }

      const { error } = await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: sub.endpoint,
        auth: sub.keys?.auth,
        p256dh: sub.keys?.p256dh,
      }, { onConflict: 'endpoint' });

      if (error) throw error;

      alert("通知の設定が完了したよ！これで準備万端だね。");
    } catch (error) {
      console.error("通知の保存に失敗…", error);
      alert("エラーが発生しちゃった。コンソールを確認して？");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 mt-4">
      <h3 className="text-xs font-black text-slate-500 uppercase mb-2 ml-1">System Notification</h3>
      <button
        onClick={handleEnableNotification}
        disabled={loading}
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-xl font-black text-xs transition-all active:scale-95 shadow-lg shadow-indigo-900/20"
      >
        {loading ? "同期中..." : "🔔 通知を有効にする"}
      </button>
    </div>
  );
}