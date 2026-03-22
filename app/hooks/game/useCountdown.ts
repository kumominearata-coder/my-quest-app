// hooks/game/useCountdown.ts
import { useState, useEffect } from 'react';

export function useCountdown(startTime: string | null, duration: number) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!startTime) return;

    const calculateTimeLeft = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const elapsed = Math.floor((now - start) / 1000); // 経過時間（秒）
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);
    };

    calculateTimeLeft(); // 初回計算
    const timer = setInterval(calculateTimeLeft, 1000); // 1秒ごとに更新

    return () => clearInterval(timer);
  }, [startTime, duration]);

  return timeLeft;
}