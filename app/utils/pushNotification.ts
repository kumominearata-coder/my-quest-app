// utils/pushNotification.ts

export async function subscribeToPush() {
  if (!('serviceWorker' in navigator)) return null;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  
  // 🌿 1. 鍵の存在チェック（ここはもう「あり」のはず！）
  if (!publicKey) {
    alert("VAPIDキーが見つかりません");
    return null;
  }

  try {
    // 🌿 2. SWの登録（scopeを明示的に指定）
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    await navigator.serviceWorker.ready;

    // 🌿 3. 購読実行
    // ここでエラーが出るなら、鍵の形式かブラウザの制限だよ
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    return subscription;
  } catch (error: any) {
    // 🌿 【最重要】エラーの名前とメッセージを直接画面に出す！
    alert(`【購読エラー発生】\n種類: ${error.name}\n内容: ${error.message}`);
    throw error; // NotificationSetting.tsx の catch に飛ばす
  }
}

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