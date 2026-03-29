// hooks/game/useCountdown.ts
import { useState, useEffect } from 'react';

export function useCountdown(startTime: string | null, duration: number) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!startTime) return;

    const calculateTimeLeft = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const realElapsedSeconds = Math.floor((now - start) / 1000);
      const gameElapsedSeconds = realElapsedSeconds * 3;
      const remaining = Math.max(0, duration - gameElapsedSeconds);
      setTimeLeft(remaining);
    };

    calculateTimeLeft(); // 初回計算
    const timer = setInterval(calculateTimeLeft, 1000); // 1秒ごとに更新

    return () => clearInterval(timer);
  }, [startTime, duration]);

  return timeLeft;
}