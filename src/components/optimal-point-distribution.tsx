"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RobotWithSkill } from "@/lib/optimization";
import { getRatioBadgeClass } from "@/lib/ratio-heatmap";
import { Progress } from "@/components/ui/progress";
import {
  Target,
  Zap,
  Flame,
  User,
  Trophy,
  Medal,
  ThumbsUp,
  HelpCircle,
  BarChart3,
  Users,
  Settings,
} from "lucide-react";

interface OptimalPointDistributionProps {
  assignments: Record<string, RobotWithSkill[]>;
  totalPoints: number;
  totalSkillValue: number;
  efficiency: number;
  pointLimit: number;
}

export function OptimalPointDistribution({
  assignments,
  totalPoints,
  totalSkillValue,
  efficiency,
  pointLimit,
}: OptimalPointDistributionProps) {
  const players = Object.keys(assignments);

  if (players.length === 0 || totalPoints === 0) {
    return (
      <Card className="animate-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <CardTitle>🎯 最適ポイント配分</CardTitle>
          <CardDescription>
            有効な配分パターンが見つかりませんでした
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // プレイヤー別のポイント使用量を計算
  const playerDistributions = players
    .map((playerName) => {
      const robots = assignments[playerName] || [];
      const playerPoints = robots.reduce((sum, robot) => sum + robot.ratio, 0);
      const playerSkillValue = robots.reduce(
        (sum, robot) => sum + robot.skillValue,
        0
      );
      const playerEfficiency =
        playerPoints > 0 ? playerSkillValue / playerPoints : 0;

      // メイン機の数を計算
      const mainRobots = robots.filter(
        (robot) => robot.skillLevel === "メイン機"
      ).length;
      const subRobots = robots.filter(
        (robot) => robot.skillLevel === "サブ機"
      ).length;

      return {
        playerName,
        points: playerPoints,
        skillValue: playerSkillValue,
        efficiency: playerEfficiency,
        robots,
        mainRobots,
        subRobots,
        percentage: (playerPoints / totalPoints) * 100,
      };
    })
    .sort((a, b) => b.points - a.points); // ポイント使用量の多い順

  const getPlayerIcon = (name: string) => {
    if (name.includes("あんのーん"))
      return <Target className="w-5 h-5 text-blue-600" />;
    if (name.includes("おたいき"))
      return <Zap className="w-5 h-5 text-yellow-600" />;
    if (name.includes("たっちん"))
      return <Flame className="w-5 h-5 text-red-600" />;
    return <User className="w-5 h-5 text-gray-600" />;
  };

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case "メイン機":
        return <Trophy className="w-4 h-4 text-yellow-600" />;
      case "サブ機":
        return <Medal className="w-4 h-4 text-blue-600" />;
      case "一応乗れる":
        return <ThumbsUp className="w-4 h-4 text-green-600" />;
      case "自信なし":
        return <HelpCircle className="w-4 h-4 text-orange-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <Card className="animate-in slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-blue-600" />
          <span>最適ポイント配分</span>
        </CardTitle>
        <CardDescription>
          {pointLimit}PT制限での最高効率な役割分担
        </CardDescription>
        <div className="flex space-x-4 mt-3">
          <Badge variant="outline" className="text-lg">
            使用: {totalPoints}PT / {pointLimit}PT
          </Badge>
          <Badge variant="secondary" className="text-lg">
            チームスキル値: {totalSkillValue}
          </Badge>
          <Badge className="bg-purple-500 text-lg">
            効率: {efficiency.toFixed(2)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* ポイント配分の視覚的表示 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <span>ポイント配分</span>
          </h3>
          <div className="space-y-3">
            {playerDistributions.map((player) => (
              <div key={player.playerName} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getPlayerIcon(player.playerName)}
                    <span className="font-medium">{player.playerName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">{player.points}PT</Badge>
                    <Badge variant="secondary">
                      {player.percentage.toFixed(1)}%
                    </Badge>
                    {player.mainRobots > 0 && (
                      <Badge className="bg-green-500 flex items-center space-x-1">
                        <Trophy className="w-3 h-3" />
                        <span>{player.mainRobots}機</span>
                      </Badge>
                    )}
                    {player.subRobots > 0 && (
                      <Badge className="bg-blue-500 flex items-center space-x-1">
                        <Medal className="w-3 h-3" />
                        <span>{player.subRobots}機</span>
                      </Badge>
                    )}
                  </div>
                </div>
                <Progress value={player.percentage} className="h-3" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
