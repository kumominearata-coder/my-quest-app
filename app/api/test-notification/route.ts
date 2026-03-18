// app/api/test-notification/route.ts
import { NextResponse } from 'next/server';
import webpush from 'web-push';

// 鍵の設定（.env.local から読み込む）
webpush.setVapidDetails(
  'mailto:your-email@example.com', // おにいのメアドでOK
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY! // さっき作った秘密鍵！
);

export async function POST(request: Request) {
  const { subscription } = await request.json();

  const payload = JSON.stringify({
    title: "クエスト完了！",
    body: "おにい、テスト通知だよ。ちゃんと届いた？",
    url: "/"
  });

  try {
    await webpush.sendNotification(subscription, payload);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("通知送信エラー:", error);
    return NextResponse.json({ error: "送信失敗" }, { status: 500 });
  }
}