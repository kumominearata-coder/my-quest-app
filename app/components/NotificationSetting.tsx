// app/components/NotificationSetting.tsx
"use client";

import { useState } from "react";
import { subscribeToPush } from "@/app/utils/pushNotification";
import { createBrowserClient } from "@supabase/ssr";

// クライアントの作成は関数の外でOK
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// --- 🌿 ここに「default」をつける ---
export default function NotificationSetting() {
  const [loading, setLoading] = useState(false);

  const handleEnableNotification = async () => {
    // ...（中身はさっきのままで大丈夫！）
    console.log("ボタンが押されたよ！");
    setLoading(true);

    try {
      // テスト用ログイン（emailとpasswordが.envにある前提）
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        await supabase.auth.signInWithPassword({
          email: 'kumomine.arata@gmail.com',
          password: 'isomer31415', // さっき設定したやつね
        });
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const subscription = await subscribeToPush();
      if (!subscription) return;

      const sub = subscription.toJSON();
      const { error } = await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        endpoint: sub.endpoint,
        auth: sub.keys?.auth,
        p256dh: sub.keys?.p256dh,
      }, { onConflict: 'endpoint' });

      if (error) throw error;
      alert("通知の設定が完了したよ！");
    } catch (err) {
      console.error(err);
      alert("失敗しちゃった…");
    } finally {
      setLoading(false);
    }
  };

  const [testLoading, setTestLoading] = useState(false);

const handleTestNotification = async () => {
  setTestLoading(true);
  try {
    // 1. 今の購読情報を取得
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      alert("先に通知を有効にしてね！");
      return;
    }

    // 2. 作ったAPIに「送って！」とお願いする
    const res = await fetch('/api/test-notification', {
      method: 'POST',
      body: JSON.stringify({ subscription }),
    });

    if (res.ok) {
      alert("送信リクエストを送ったよ。画面の隅っこを見てて！");
    }
  } catch (err) {
    console.error(err);
  } finally {
    setTestLoading(false);
  }
};

  return (
    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 mt-4">
      <button
        onClick={handleEnableNotification}
        disabled={loading}
        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs"
      >
        {loading ? "同期中..." : "🔔 通知を有効にする"}
      </button>

    {/* 2. テスト通知を飛ばすボタン (新しく追加！) */}
      <button
        onClick={handleTestNotification}
        disabled={testLoading || loading}
        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-xs hover:bg-emerald-500 disabled:opacity-50 transition-colors"
      >
        {testLoading ? "送信中..." : "🚀 テスト通知を飛ばす"}
      </button>
   </div>
  );
}