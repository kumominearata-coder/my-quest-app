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
  const [testLoading, setTestLoading] = useState(false);

  const handleEnableNotification = async () => {
    setLoading(true);
    try {
      // 1. ブラウザに「すでに登録済みか」聞く
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      // 2. なければ新しく作る（ここで VAPID 鍵が必要になる）
      if (!subscription) {
        subscription = await subscribeToPush();
      }

      if (!subscription) {
        alert("購読に失敗したよ。権限を確認してね。");
        return;
      }

      // 3. Supabaseへ保存（upsert）
      const { data: { user } } = await supabase.auth.getUser();
      const subJSON = subscription.toJSON();
      
      const { error } = await supabase.from("push_subscriptions").upsert({
        user_id: user?.id || null, 
        endpoint: subJSON.endpoint,
        auth: subJSON.keys?.auth,
        p256dh: subJSON.keys?.p256dh,
      }, { onConflict: 'endpoint' }); // endpoint が同じなら上書きする設定

      if (error) throw error;

      alert("Supabase への保存も完了したよ！これで完璧。");
    } catch (err: any) {
      console.error(err);
      alert(`エラー詳細: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setTestLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        alert("先に通知を有効にしてね");
        return;
      }

      const res = await fetch('/api/test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });

      if (res.ok) {
        alert("送信したよ！");
      } else {
        alert("送信に失敗したみたい…");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 mt-4">
      <button
        onClick={handleEnableNotification}
        disabled={loading}
        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs"
      >
        {loading ? "設定中..." : "🔔 通知を有効にする"}
      </button>

      <button
        onClick={handleTestNotification}
        disabled={testLoading || loading}
        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-black text-xs"
      >
        {testLoading ? "送信中..." : "🚀 テスト通知を飛ばす"}
      </button>
    </div>
  );
}