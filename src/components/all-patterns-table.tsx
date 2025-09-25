"use client";

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
} from "lucide-react";

interface PlayerPattern {
  playerName: string;
  pointUsage: number;
  robots: RobotWithSkill[];
  mainRobotCount: number;
  efficiency: number;
}

interface TeamCombination {
  totalPoints: number;
  playerAssignments: Record<string, RobotWithSkill[]>;
  totalMainRobots: number;
  totalSkillValue: number;
  efficiency: number;
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
}

export function AllPatternsTable({
  patterns,
  totalPointLimit,
  playerNames,
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

  const getSkillIcon = (skill: string) => {
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

  // プレイヤー別パターンをチーム組み合わせに変換
  const generateTeamCombinations = (): TeamCombination[] => {
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

    const combinations: TeamCombination[] = [];

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

          combinations.push({
            totalPoints: currentPoints,
            playerAssignments: { ...currentAssignment },
            totalMainRobots,
            totalSkillValue,
            efficiency,
          });
        }
        return;
      }

      const playerName = playerNames[playerIndex];
      const playerPatterns = playerPatternMap[playerName] || [];

      // このプレイヤーの各パターンを試す
      playerPatterns.forEach((pattern) => {
        const newPoints = currentPoints + pattern.pointUsage;
        if (newPoints <= totalPointLimit) {
          const newAssignment = { ...currentAssignment };
          newAssignment[playerName] = pattern.robots;
          generateCombinations(playerIndex + 1, newAssignment, newPoints);
        }
      });
    }

    generateCombinations(0, {}, 0);

    // メイン機数 → 効率でソート
    return combinations
      .sort((a, b) => {
        if (a.totalMainRobots !== b.totalMainRobots) {
          return b.totalMainRobots - a.totalMainRobots;
        }
        return b.efficiency - a.efficiency;
      })
      .slice(0, 20); // 上位20パターンに限定
  };

  const teamCombinations = generateTeamCombinations();

  const renderRobotCell = (robots: RobotWithSkill[]) => {
    if (robots.length === 0) {
      return <span className="text-gray-400">-</span>;
    }

    return (
      <div className="space-y-1">
        {robots.map((robot, index) => (
          <div
            key={index}
            className="flex items-center flex-wrap gap-1 text-xs"
          >
            {getSkillIcon(robot.skillLevel)}
            <span className="font-medium">{robot.name}</span>
            <Badge
              className={getRatioBadgeClass(robot.ratio)}
              variant="secondary"
            >
              {robot.ratio}PT
            </Badge>
            <span className="text-gray-500 text-xs">({robot.skillLevel})</span>
          </div>
        ))}
      </div>
    );
  };

  if (teamCombinations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TableIcon className="w-5 h-5 text-blue-600" />
            <span>チーム編成パターン表</span>
          </CardTitle>
          <CardDescription>編成パターンが見つかりませんでした</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="animate-in slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TableIcon className="w-5 h-5 text-blue-600" />
          <span>チーム編成パターン表</span>
        </CardTitle>
        <CardDescription>
          {totalPointLimit}PT制限でのチーム編成組み合わせ（メイン機数順）
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              {teamCombinations.map((combination, index) => (
                <TableRow
                  key={index}
                  className={
                    combination.totalMainRobots > 0 ? "bg-green-50" : ""
                  }
                >
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-base">
                      {combination.totalPoints}PT
                    </Badge>
                  </TableCell>
                  {playerNames.map((playerName) => (
                    <TableCell key={playerName} className="text-center">
                      {renderRobotCell(
                        combination.playerAssignments[playerName] || []
                      )}
                    </TableCell>
                  ))}
                  <TableCell className="text-center">
                    <Badge
                      className={
                        combination.totalMainRobots > 0
                          ? "bg-yellow-500"
                          : "bg-gray-300"
                      }
                      variant={
                        combination.totalMainRobots > 0
                          ? "default"
                          : "secondary"
                      }
                    >
                      {combination.totalMainRobots}機
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">
                      {combination.efficiency.toFixed(2)}
                    </Badge>
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
          <div>• 各行が1つのチーム編成パターン</div>
          <div>• メイン機数が多い順 → 効率が良い順で並び替え</div>
          <div>• 理想的なパターン: 全プレイヤーがメイン機を使用</div>
        </div>
      </CardContent>
    </Card>
  );
}
