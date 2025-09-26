"use client";

import React, { memo, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RobotWithSkill } from "@/lib/optimization";
import { SkillLevel } from "@/types";
import { getRatioBadgeClass } from "@/lib/ratio-heatmap";
import {
  Target,
  Zap,
  Flame,
  User,
  Trophy,
  Medal,
  ThumbsUp,
  HelpCircle,
  X,
  TableIcon,
  Lock,
} from "lucide-react";

// 1行1編成パターンのデータ
interface TeamRow {
  totalPoints: number;
  playerAssignments: Record<string, RobotWithSkill[]>;
  totalMainRobots: number;
  efficiency: number;
  combinationId: string;
}

interface AllPatternsTableProps {
  patterns: Array<{
    playerName: string;
    pointUsage: number;
    robots: RobotWithSkill[];
    alternatives?: Array<{
      playerName: string;
      pointUsage: number;
      robots: RobotWithSkill[];
    }>;
  }>;
  totalPointLimit: number;
  playerNames: string[];
  lockedRobots?: Record<string, string>;
}

function AllPatternsTableComponent({
  patterns,
  totalPointLimit,
  playerNames,
  lockedRobots = {},
}: AllPatternsTableProps) {
  const getPlayerIcon = (name: string) => {
    if (name.includes("あんのーん"))
      return <Target className="w-4 h-4 text-blue-600" />;
    if (name.includes("おたいき"))
      return <Zap className="w-4 h-4 text-yellow-600" />;
    if (name.includes("たっちん"))
      return <Flame className="w-4 h-4 text-red-600" />;
    return <User className="w-4 h-4 text-gray-600" />;
  };

  const getSkillIcon = (skill: SkillLevel) => {
    switch (skill) {
      case "メイン機":
        return <Trophy className="w-3 h-3 text-yellow-600" />;
      case "サブ機":
        return <Medal className="w-3 h-3 text-blue-600" />;
      case "一応乗れる":
        return <ThumbsUp className="w-3 h-3 text-green-600" />;
      case "自信なし":
        return <HelpCircle className="w-3 h-3 text-orange-600" />;
      case "使えない":
        return <X className="w-3 h-3 text-red-600" />;
      default:
        return <HelpCircle className="w-3 h-3 text-gray-600" />;
    }
  };

  // プレイヤー別パターンを1行1編成パターンに変換
  const generateTeamRows = (): TeamRow[] => {
    const playerPatternMap: Record<
      string,
      Array<{ pointUsage: number; robots: RobotWithSkill[] }>
    > = {};

    // 各プレイヤーのパターンを整理
    patterns.forEach((pattern) => {
      if (!playerPatternMap[pattern.playerName]) {
        playerPatternMap[pattern.playerName] = [];
      }

      playerPatternMap[pattern.playerName].push({
        pointUsage: pattern.pointUsage,
        robots: pattern.robots,
      });

      // 代替パターンも追加
      if (pattern.alternatives) {
        pattern.alternatives.forEach((alt) => {
          playerPatternMap[pattern.playerName].push({
            pointUsage: alt.pointUsage,
            robots: alt.robots,
          });
        });
      }
    });

    const rows: TeamRow[] = [];

    // 各プレイヤーのパターンを組み合わせてチーム編成を生成
    function generateCombinations(
      playerIndex: number,
      currentAssignment: Record<string, RobotWithSkill[]>,
      currentPoints: number
    ) {
      if (playerIndex >= playerNames.length) {
        // チーム編成完成
        if (currentPoints <= totalPointLimit && currentPoints > 0) {
          const totalMainRobots = Object.values(currentAssignment)
            .flat()
            .filter((r) => r.skillLevel === "メイン機").length;
          const totalSkillValue = Object.values(currentAssignment)
            .flat()
            .reduce((sum, r) => sum + r.skillValue, 0);
          const efficiency = totalSkillValue / currentPoints;

          // 組み合わせIDを生成（機体名も含めて完全にユニークに）
          const assignmentKey = Object.entries(currentAssignment)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(
              ([playerName, robots]) =>
                `${playerName}:${robots
                  .map((r) => r.name)
                  .sort()
                  .join(",")}`
            )
            .join("|");
          const combinationId = assignmentKey;
          
          // デバッグ用: 重複チェック
          const existingRow = rows.find(r => r.combinationId === combinationId);
          if (existingRow) {
            // 既に同じ組み合わせがある場合はスキップ
            return;
          }

          // 1行1編成パターンとして追加
          rows.push({
            totalPoints: currentPoints,
            playerAssignments: { ...currentAssignment },
            totalMainRobots,
            efficiency,
            combinationId,
          });
        }
        return;
      }

      const playerName = playerNames[playerIndex];
      const playerPatterns = playerPatternMap[playerName] || [];

      // このプレイヤーの各パターンを試す
      playerPatterns.forEach((pattern) => {
        const newPoints = currentPoints + pattern.pointUsage;

        // 固定機体チェック
        const playerLockedRobot = lockedRobots[playerName];
        if (playerLockedRobot) {
          // 固定機体が指定されている場合、そのロボットが含まれているかチェック
          const hasLockedRobot = pattern.robots.some(
            (robot) => robot.name === playerLockedRobot
          );
          if (!hasLockedRobot) {
            return; // 固定機体が含まれていないパターンはスキップ
          }
        }

        if (newPoints <= totalPointLimit) {
          const newAssignment = { ...currentAssignment };
          newAssignment[playerName] = pattern.robots;
          generateCombinations(playerIndex + 1, newAssignment, newPoints);
        }
      });
    }

    generateCombinations(0, {}, 0);

    // 効率 → 総ポイントでソートして上位20組み合わせに限定
    const uniqueCombinations = Array.from(
      new Set(rows.map((r) => r.combinationId))
    )
      .map((id) => rows.find((r) => r.combinationId === id)!)
      .sort((a, b) => {
        // 第一に効率が高い順
        if (Math.abs(a.efficiency - b.efficiency) > 0.01) {
          return b.efficiency - a.efficiency;
        }
        // 第二に総ポイントが高い順
        return b.totalPoints - a.totalPoints;
      })
      .slice(0, 20);

    // 選択された組み合わせの行のみを返す
    return rows.filter((row) =>
      uniqueCombinations.some(
        (combo) => combo.combinationId === row.combinationId
      )
    );
  };

  // チーム行データをメモ化してパフォーマンス向上
  const teamRows = useMemo(
    () => generateTeamRows(),
    [patterns, playerNames, totalPointLimit]
  );

  const renderRobotCell = (robots: RobotWithSkill[]) => {
    if (robots.length === 0) {
      return <span className="text-gray-400">-</span>;
    }

    return (
      <div className="space-y-1">
        {robots.map((robot, index) => {
          const isLocked = lockedRobots[robot.playerName] === robot.name;
          return (
            <div
              key={index}
              className="flex items-center flex-wrap gap-1 text-xs"
            >
              {getSkillIcon(robot.skillLevel)}
              <Badge
                className={getRatioBadgeClass(robot.ratio)}
                variant="secondary"
              >
                {robot.ratio}PT
              </Badge>
              <span className="font-medium">{robot.name}</span>
              <span className="text-gray-500 text-xs">
                ({robot.skillLevel})
              </span>
              {isLocked && (
                <div title="固定された機体">
                  <Lock className="w-3 h-3 text-blue-600" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  if (teamRows.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        編成パターンが見つかりませんでした
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 p-3 bg-blue-50 rounded-lg text-sm">
        <div className="font-semibold text-blue-800 mb-2">
          💡 効率の計算方法
        </div>
        <div className="text-blue-700">
          効率 = 総スキル値 ÷ 総ポイント数
          <br />
          スキル値: メイン機=4, サブ機=3, 一応乗れる=2, 自信なし=1, 使えない=0
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20 text-center">総ポイント</TableHead>
              {playerNames.map((playerName) => (
                <TableHead key={playerName} className="text-center min-w-48">
                  <div className="flex items-center justify-center space-x-2">
                    {getPlayerIcon(playerName)}
                    <span>{playerName}</span>
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-20 text-center">メイン機</TableHead>
              <TableHead className="w-20 text-center">効率</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teamRows.map((row, index) => (
              <TableRow
                key={`${row.combinationId}-${index}`}
                className={row.totalMainRobots > 0 ? "bg-green-50" : ""}
              >
                <TableCell className="text-center">
                  <Badge variant="outline" className="text-base">
                    {row.totalPoints}PT
                  </Badge>
                </TableCell>
                {playerNames.map((playerName) => (
                  <TableCell key={playerName} className="text-center">
                    {renderRobotCell(row.playerAssignments[playerName] || [])}
                  </TableCell>
                ))}
                <TableCell className="text-center">
                  <Badge
                    className={
                      row.totalMainRobots > 0 ? "bg-yellow-500" : "bg-gray-300"
                    }
                    variant={row.totalMainRobots > 0 ? "default" : "secondary"}
                  >
                    {row.totalMainRobots}機
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{row.efficiency.toFixed(2)}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <div>💡 表の見方:</div>
        <div>
          • <span className="px-2 py-1 bg-green-50 rounded">緑色の行</span>:
          メイン機を使用するチーム編成（推奨）
        </div>
        <div>• 各行が1人1機体の使用状況</div>
        <div>• 同じ総ポイント・メイン機数・効率の行は同じチーム編成</div>
        <div>• メイン機数が多い順 → 効率が良い順で並び替え</div>
      </div>
    </div>
  );
}

// メモ化してパフォーマンス向上
export const AllPatternsTable = memo(AllPatternsTableComponent);
