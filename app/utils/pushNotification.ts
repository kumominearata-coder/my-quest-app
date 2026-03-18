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
  if (!('serviceWorker' in navigator)) return null;

  try {
    // 1. まず現在の許可状態をチェック
    let permission = Notification.permission;
    console.log("現在の権限:", permission);

    // 2. もし「まだ聞いてない」なら聞く
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    // 3. 許可されていなければ、ここで終了（おにいのスマホはここを通っちゃってるかも）
    if (permission !== 'granted') {
      console.error("権限がありません:", permission);
      // 強制的にダイアログをもう一度出すための最終手段
      permission = await Notification.requestPermission();
      if (permission !== 'granted') return null;
    }

    // 4. サービスワーカーの準備を待つ
    await navigator.serviceWorker.register('/sw.js');
    const registration = await navigator.serviceWorker.ready;

    // 5. 購読処理
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) return null;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    return subscription;
  } catch (error) {
    console.error("購読エラー:", error);
    return null;
  }
}