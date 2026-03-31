/**
 * 作業台（labor）の合計所要秒数。DB の labor_quantity が無い・null のときは 1 個分として扱う。
 */
export function getLaborTotalDurationSeconds(
  recipeDuration: number,
  laborQuantity: number | null | undefined
): number {
  const q = Math.max(1, laborQuantity ?? 1);
  return recipeDuration * q;
}
