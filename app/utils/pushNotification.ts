// utils/pushNotification.ts

// 🌿 さっき生成した Public Key をここに入れるよ
const VAPID_PUBLIC_KEY = "BHRqDCSW56Pao5A_-vHSg7NcIc3VhpoWCzMhZNvi_VHIR9pCcvCqK8xZMV7qzoJpFEjY0AnIO9Mjvv5szDQEO-w";

/**
 * URLセーフなBase64をUint8Arrayに変換する魔法の関数
 * （プッシュ通知の鍵の形式を整えるのに必要なんだ）
 */
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * 【重要】ブラウザからプッシュ通知の「購読（Subscription）」を取得する
 */
export async function subscribeToPush() {
  try {
    // 1. Service Workerが動いているかチェック
    const registration = await navigator.serviceWorker.ready;

    // 2. すでに購読済みか確認
    let subscription = await registration.pushManager.getSubscription();

    // 3. まだなら、新しく購読を開始（通知許可のダイアログが出るよ）
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true, // 常に通知を表示することを約束する
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // 🌿 この subscription オブジェクトを Supabase に保存することになるよ
    console.log("プッシュ購読成功！住所はこちら:", JSON.stringify(subscription));
    return subscription;
  } catch (error) {
    console.error("プッシュ購読に失敗したみたい…", error);
    return null;
  }
}