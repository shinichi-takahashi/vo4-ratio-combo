import { Player, SkillLevel } from "@/types";
import LZString from "lz-string";
import robotData from "@/data/robots.json";

// 機体名を短縮IDにマップ
const robotNameToId = new Map<string, number>();
const robotIdToName = new Map<number, string>();

// マップを初期化
robotData.forEach((robot, index) => {
  robotNameToId.set(robot.name, index);
  robotIdToName.set(index, robot.name);
});

// データを圧縮してURLに適した形式に変換
export function encodePlayersToUrl(players: Player[]): string {
  try {
    // プレイヤーデータを圧縮可能な形式に変換
    const compressedData = players.map((player) => ({
      n: player.name, // name -> n
      s: Object.entries(player.skills).reduce((acc, [robotName, skill]) => {
        // スキルレベルを数値に変換（使えない=0, 自信なし=1, 一応乗れる=2, サブ機=3, メイン機=4）
        const skillValue = getSkillValue(skill);
        if (skillValue > 0) {
          // 機体名をIDに変換して使えない以外のみ保存
          const robotId = robotNameToId.get(robotName);
          if (robotId !== undefined) {
            acc[robotId] = skillValue;
          }
        }
        return acc;
      }, {} as Record<number, number>),
    }));

    // JSON文字列化してLZ圧縮
    const jsonString = JSON.stringify(compressedData);
    return LZString.compressToEncodedURIComponent(jsonString);
  } catch (error) {
    console.error("Failed to encode players to URL:", error);
    return "";
  }
}

// URLからデータを復元
export function decodePlayersFromUrl(encodedData: string): Player[] {
  try {
    if (!encodedData) return [];

    // LZ圧縮解除
    const jsonString = LZString.decompressFromEncodedURIComponent(encodedData);
    if (!jsonString) return [];
    
    const compressedData = JSON.parse(jsonString);

    // プレイヤーデータを復元
    return compressedData.map((player: any, index: number) => ({
      id: index + 1,
      name: player.n || `プレイヤー${index + 1}`,
      skills: expandSkills(player.s || {}),
    }));
  } catch (error) {
    console.error("Failed to decode players from URL:", error);
    return [];
  }
}

// スキルレベルを数値に変換
function getSkillValue(skill: SkillLevel): number {
  const skillMap: Record<SkillLevel, number> = {
    使えない: 0,
    自信なし: 1,
    一応乗れる: 2,
    サブ機: 3,
    メイン機: 4,
  };
  return skillMap[skill] || 0;
}

// 数値をスキルレベルに変換
function getSkillFromValue(value: number): SkillLevel {
  const valueMap: Record<number, SkillLevel> = {
    0: "使えない",
    1: "自信なし",
    2: "一応乗れる",
    3: "サブ機",
    4: "メイン機",
  };
  return valueMap[value] || "使えない";
}

// スキルデータを全機体分に展開
function expandSkills(
  compressedSkills: Record<number, number>
): Record<string, SkillLevel> {
  const expandedSkills: Record<string, SkillLevel> = {};

  // 圧縮データから復元（IDを機体名に変換）
  Object.entries(compressedSkills).forEach(([robotIdStr, value]) => {
    const robotId = parseInt(robotIdStr, 10);
    const robotName = robotIdToName.get(robotId);
    if (robotName) {
      expandedSkills[robotName] = getSkillFromValue(value);
    }
  });

  return expandedSkills;
}

// URLクエリパラメータを更新
export function updateUrlWithPlayers(players: Player[]): void {
  if (typeof window === "undefined") return; // SSR対応

  const encodedData = encodePlayersToUrl(players);
  const url = new URL(window.location.href);

  if (encodedData) {
    url.searchParams.set("data", encodedData);
  } else {
    url.searchParams.delete("data");
  }

  // URLを更新（履歴に追加せずに）- 次のフレームで実行してレンダリング競合を回避
  setTimeout(() => {
    window.history.replaceState({}, "", url.toString());
  }, 0);
}

// URLからプレイヤーデータを読み込み
export function loadPlayersFromUrl(): Player[] {
  if (typeof window === "undefined") return []; // SSR対応

  const url = new URL(window.location.href);
  const encodedData = url.searchParams.get("data");

  if (encodedData) {
    return decodePlayersFromUrl(encodedData);
  }

  return [];
}

// 確定URLを生成（共有用）
export function generateShareableUrl(): string {
  if (typeof window === "undefined") return "";
  return window.location.href;
}

// URLをクリップボードにコピー
export async function copyUrlToClipboard(): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(window.location.href);
    return true;
  } catch (error) {
    console.error("Failed to copy URL to clipboard:", error);
    return false;
  }
}
