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

interface PlayerPointPattern {
  playerName: string;
  pointUsage: number;
  robots: RobotWithSkill[];
  efficiency: number;
  description: string;
}

interface PlayerPointPatternsProps {
  patterns: PlayerPointPattern[];
}

export function PlayerPointPatterns({ patterns }: PlayerPointPatternsProps) {
  if (patterns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 プレイヤー別ポイント使用パターン</CardTitle>
          <CardDescription>
            プレイヤー別の最適な機体組み合わせが見つかりませんでした
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // プレイヤーごとにグループ化
  const groupedPatterns = patterns.reduce((acc, pattern) => {
    if (!acc[pattern.playerName]) {
      acc[pattern.playerName] = [];
    }
    acc[pattern.playerName].push(pattern);
    return acc;
  }, {} as Record<string, PlayerPointPattern[]>);

  const getPlayerEmoji = (name: string) => {
    if (name.includes("あんのーん")) return "🎯";
    if (name.includes("おたいき")) return "⚡";
    if (name.includes("たっちん")) return "🔥";
    return "👤";
  };

  return (
    <Card className="animate-in slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <CardTitle>📊 プレイヤー別ポイント使用パターン</CardTitle>
        <CardDescription>
          各プレイヤーが異なるポイント数を使用する場合の最適な機体組み合わせ
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(groupedPatterns).map(([playerName, playerPatterns]) => (
          <div key={playerName} className="space-y-3">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-lg">{getPlayerEmoji(playerName)}</span>
              <h3 className="text-lg font-semibold">{playerName}</h3>
              <Badge variant="outline">{playerPatterns.length}パターン</Badge>
            </div>

            <div className="grid gap-3">
              {playerPatterns.map((pattern, index) => (
                <PatternCard key={index} pattern={pattern} />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function PatternCard({ pattern }: { pattern: PlayerPointPattern }) {
  const skillColors = {
    メイン機: "bg-green-500",
    サブ機: "bg-blue-500",
    一応乗れる: "bg-yellow-500",
    自信なし: "bg-orange-500",
    使えない: "bg-red-500",
  };

  const getSkillEmoji = (skill: string) => {
    switch (skill) {
      case "メイン機":
        return "🏆";
      case "サブ機":
        return "🥈";
      case "一応乗れる":
        return "👍";
      case "自信なし":
        return "🤔";
      case "使えない":
        return "❌";
      default:
        return "❓";
    }
  };

  const totalSkillValue = pattern.robots.reduce(
    (sum, robot) => sum + robot.skillValue,
    0
  );

  return (
    <Card className="border-l-4 border-l-purple-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{pattern.description}</CardTitle>
          <div className="flex space-x-2">
            <Badge variant="outline">{pattern.pointUsage}PT</Badge>
            <Badge variant="secondary">スキル値: {totalSkillValue}</Badge>
            <Badge className="bg-purple-500">
              効率: {pattern.efficiency.toFixed(2)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {pattern.robots.length > 0 ? (
          <div className="space-y-2">
            {pattern.robots.map((robot, robotIndex) => (
              <div
                key={robotIndex}
                className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">
                    {getSkillEmoji(robot.skillLevel)}
                  </span>
                  <span className="font-medium text-sm">{robot.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getRatioBadgeClass(robot.ratio)}>
                    R:{robot.ratio}
                  </Badge>
                  <Badge
                    className={`${
                      skillColors[robot.skillLevel]
                    } text-white text-xs`}
                  >
                    {robot.skillLevel}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    +{robot.skillValue}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm">
              このポイント数では機体が選択されませんでした
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
