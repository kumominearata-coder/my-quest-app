import { useState, useEffect } from 'react';

/**
 * G.R.I.T. 時間同期システム
 * 23日ごとに季節が移り変わる特別仕様
 */
export function useGameTime() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const h = now.getHours();
  const m = now.getMinutes();
  const s = now.getSeconds();

  const month = now.getMonth(); 
  const startMonths = [2, 5, 8, 11]; // 3, 6, 9, 12月
  const currentStartMonth = [...startMonths].reverse().find(sm => month >= sm) ?? 11;

  const yearForStart = (currentStartMonth === 11 && month < 2) ? now.getFullYear() - 1 : now.getFullYear();
  const seasonStartDate = new Date(yearForStart, currentStartMonth, 1);

  // シーズン開始（3,6,9,12月の1日）からの経過日数 (1〜90日前後)
  const diffTime = now.getTime() - seasonStartDate.getTime();
  const dayOfSeason = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // 23日周期での季節判定と、その季節の何日目かの計算
  let currentSeason = "";
  let dayInCurrentSeason = 0;

  if (dayOfSeason <= 23) {
    currentSeason = "SPRING";
    dayInCurrentSeason = dayOfSeason;
  } else if (dayOfSeason <= 46) {
    currentSeason = "SUMMER";
    dayInCurrentSeason = dayOfSeason - 23;
  } else if (dayOfSeason <= 69) {
    currentSeason = "AUTUMN";
    dayInCurrentSeason = dayOfSeason - 46;
  } else {
    currentSeason = "WINTER";
    dayInCurrentSeason = dayOfSeason - 69;
  }

  const isDaylight = h >= 6 && h < 19;

  return {
    displayTime: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
    // 表示を「季節名 DAY-その季節の日数」に変更
    displayDate: `${currentSeason} DAY-${dayInCurrentSeason.toString().padStart(2, '0')}`,
    currentSeason,
    dayOfYear: dayOfSeason,
    isDaylight,
    h, m, s
  };
}