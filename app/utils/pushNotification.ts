// utils/pushNotification.ts

export async function subscribeToPush() {
  if (!('serviceWorker' in navigator)) {
    alert("Service Worker 非対応だよ");
    return null;
  }

  try {
    // 1. 公開鍵のチェック
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      alert("鍵が空っぽだよ！Vercelの設定を見て！");
      return null;
    }

    // 2. Service Worker の登録を確実にする
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    
    // 登録が終わるまで少し待つおまじない
    await navigator.serviceWorker.ready;

    // 3. 購読処理を実行
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    return subscription;
  } catch (error: any) {
    // 🌿 ここが重要！何のエラーか具体的にアラートで出す
    alert(`エラー詳細: ${error.name} - ${error.message}`);
    console.error("購読エラー:", error);
    return null;
  }
}

// base64を変換する関数（もし別ファイルにあるならインポートしてね）
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}