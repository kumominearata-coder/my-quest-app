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
      // 1. まず通知の購読（ブラウザの許可取り）だけやる
      const subscription = await subscribeToPush();
      if (!subscription) {
        alert("ブラウザで通知を許可してね");
        return;
      }

      // 2. Supabaseに保存（とりあえず user_id は固定か、取得できれば入れる）
      const { data: { user } } = await supabase.auth.getUser();
      const sub = subscription.toJSON();
      
      const { error } = await supabase.from("push_subscriptions").upsert({
        user_id: user?.id || null, // ログインしてなくても一旦保存を試みる
        endpoint: sub.endpoint,
        auth: sub.keys?.auth,
        p256dh: sub.keys?.p256dh,
      }, { onConflict: 'endpoint' });

      if (error) throw error;
      alert("設定完了！スマホでも届くはずだよ");
    } catch (err) {
      console.error(err);
      alert("エラーが出たよ。公開鍵がVercelに入ってるか確認してね");
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