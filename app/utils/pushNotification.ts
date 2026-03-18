// 通知の購読（サブスクライブ）を行うユーティリティ

export async function subscribeToPush() {
  if (!('serviceWorker' in navigator)) return null;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) return null;

  try {
    // 1. Service Worker の登録と待機
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    await navigator.serviceWorker.ready;

    // 2. ブラウザの通知センターへ購読を依頼
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true, // ユーザーに通知が見えることを保証
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    return subscription;
  } catch (error: any) {
    // 予期せぬエラー時のみログを出す
    console.error("Push Subscription Error:", error);
    throw error; 
  }
}

/**
 * VAPID公開鍵（Base64URL形式）を
 * ブラウザが理解できる Uint8Array 形式に変換する関数
 */
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