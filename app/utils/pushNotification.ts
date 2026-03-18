// utils/pushNotification.ts

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush() {
  console.log("① subscribeToPush が呼ばれたよ");

  if (!('serviceWorker' in navigator)) {
    console.error("② ブラウザが Service Worker に対応してないよ");
    return null;
  }

  try {
    // 🌿 ここ！「待つ」前に「登録」を明示的に呼ぶ
    console.log("②.5 Service Worker を登録しにいくよ...");
    await navigator.serviceWorker.register('/sw.js'); 

    console.log("③ Service Worker の準備完了(ready)を待ってるよ...");
    const registration = await navigator.serviceWorker.ready;
    
    // 🌿 追加：もし待機中のSWがあれば強制的に有効化をお願いする
    if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }

    console.log("④ SW準備完了！:", registration.scope);

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    console.log("⑤ 公開鍵を取得したよ:", publicKey ? "OK" : "空っぽだよ！");

    if (!publicKey) return null;

    console.log("⑥ ブラウザに通知の購読をお願いしてるよ...");
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    console.log("⑦ 購読成功！:", subscription);
    return subscription;

  } catch (error) {
    console.error("❌ エラー発生:", error);
    return null;
  }
}