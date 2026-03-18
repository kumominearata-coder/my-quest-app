"use client";

import { useState } from "react";
import { subscribeToPush } from "@/app/utils/pushNotification";
import { createBrowserClient } from "@supabase/ssr";

// Supabaseクライアントの初期化
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function NotificationSetting() {
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  // 1. ブラウザで鍵を作り、Supabaseの名簿へ登録・更新する
  const handleEnableNotification = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      let subscription = await registration.pushManager.getSubscription();

      // 通知許可を得て「合鍵」を生成
      if (!subscription) {
        subscription = await subscribeToPush();
      }

      if (!subscription) return alert("通知を許可してください");

      const subJSON = subscription.toJSON();

      // 名簿（DB）へ保存。endpointが同じなら既存データを上書き（upsert）
      const { error } = await supabase
        .from("push_subscriptions")
        .upsert({
          user_id: null,
          endpoint: subJSON.endpoint,
          auth: subJSON.keys?.auth,
          p256dh: subJSON.keys?.p256dh,
        }, { 
          onConflict: 'endpoint' 
        });

      if (error) throw error;
      alert("通知設定を保存しました！");
    } catch (err: any) {
      alert(`エラー: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 2. 現在の登録情報を使ってテスト通知を発射する
  const handleTestNotification = async () => {
    setTestLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) return alert("先に通知を有効にしてください");

      const res = await fetch('/api/test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription }),
      });

      alert(res.ok ? "テスト通知を送信しました！" : "送信に失敗しました");
    } catch (err: any) {
      alert(`エラー: ${err.message}`);
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50 mt-4">
      <button
        onClick={handleEnableNotification}
        disabled={loading}
        className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs disabled:opacity-50"
      >
        {loading ? "設定中..." : "🔔 通知を有効にする"}
      </button>

      <button
        onClick={handleTestNotification}
        disabled={testLoading || loading}
        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs disabled:opacity-50"
      >
        {testLoading ? "送信中..." : "🚀 テスト通知を飛ばす"}
      </button>
    </div>
  );
}