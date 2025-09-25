export interface Robot {
  name: string;
  ratio: number;
}

export type SkillLevel =
  | "メイン機"
  | "サブ機"
  | "一応乗れる"
  | "自信なし"
  | "使えない";

export interface Player {
  id: number;
  name: string;
  skills: Record<string, SkillLevel>;
}

export interface SkillLevelInfo {
  value: number;
  color: string;
  textColor: string;
  label: string;
}

export interface OptimalCombination {
  combination: (Robot & { skillValue: number })[];
  totalPoints: number;
  totalSkillValue: number;
}

export interface TeamResult {
  player: string;
  combination: (Robot & { skillValue: number })[];
  totalPoints: number;
  totalSkillValue: number;
}

export const SKILL_LEVELS: Record<SkillLevel, SkillLevelInfo> = {
  メイン機: {
    value: 4,
    color: "bg-green-500",
    textColor: "text-white",
    label: "メイン機",
  },
  サブ機: {
    value: 3,
    color: "bg-blue-500",
    textColor: "text-white",
    label: "サブ機",
  },
  一応乗れる: {
    value: 2,
    color: "bg-yellow-500",
    textColor: "text-white",
    label: "一応乗れる",
  },
  自信なし: {
    value: 1,
    color: "bg-orange-500",
    textColor: "text-white",
    label: "自信なし",
  },
  使えない: {
    value: 0,
    color: "bg-red-500",
    textColor: "text-white",
    label: "使えない",
  },
};
