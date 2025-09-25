// レシオに基づいてヒートマップ風のクラス名を生成
export function getRatioBadgeClass(ratio: number): string {
  switch (ratio) {
    case 1:
      return "ratio-badge-1";
    case 2:
      return "ratio-badge-2";
    case 3:
      return "ratio-badge-3";
    case 4:
      return "ratio-badge-4";
    case 5:
      return "ratio-badge-5";
    case 6:
      return "ratio-badge-6";
    default:
      // 6以上の場合は最高レベルの色
      return ratio > 6 ? "ratio-badge-6" : "ratio-badge-1";
  }
}
