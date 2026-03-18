// app/api/test-notification/route.ts
import { NextResponse } from 'next/server';
import webpush from 'web-push';

export async function POST(request: Request) {
  // 🌿 ここで鍵をセットする（これならビルドエラーにならないよ）
  webpush.setVapidDetails(
    'mailto:your-email@example.com',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );

  try {
    const { subscription } = await request.json();

    const payload = JSON.stringify({
      title: "クエスト完了！",
      body: "おにい、本番環境でもテスト成功だよ！",
      url: "/"
    });

    await webpush.sendNotification(subscription, payload);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("通知送信エラー:", error);
    return NextResponse.json({ error: "送信失敗" }, { status: 500 });
  }
}