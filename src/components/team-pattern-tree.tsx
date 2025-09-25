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
  ChevronRight,
  Users,
} from "lucide-react";

interface TeamPattern {
  playerName: string;
  pointUsage: number;
  robots: RobotWithSkill[];
  alternatives?: TeamPattern[];
}

interface TeamPatternTreeProps {
  patterns: TeamPattern[];
  totalPointLimit: number;
}

export function TeamPatternTree({
  patterns,
  totalPointLimit,
}: TeamPatternTreeProps) {
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

  const renderRobotList = (robots: RobotWithSkill[]) => {
    return robots.map((robot, index) => (
      <div key={index} className="flex items-center space-x-2 text-xs">
        {getSkillIcon(robot.skillLevel)}
        <span className="font-medium">{robot.name}</span>
        <Badge className={getRatioBadgeClass(robot.ratio)} variant="secondary">
          {robot.ratio}PT
        </Badge>
      </div>
    ));
  };

  const renderPatternNode = (pattern: TeamPattern, depth: number = 0) => {
    const marginLeft = depth * 24;

    return (
      <div
        key={`${pattern.playerName}-${pattern.pointUsage}`}
        className="space-y-2"
      >
        <div
          className="flex items-center space-x-3 p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
          style={{ marginLeft: `${marginLeft}px` }}
        >
          {depth > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}

          <div className="flex items-center space-x-2">
            {getPlayerIcon(pattern.playerName)}
            <span className="font-medium">{pattern.playerName}</span>
          </div>

          <Badge variant="outline">{pattern.pointUsage}PT</Badge>

          <div className="flex-1 space-y-1">
            {renderRobotList(pattern.robots)}
          </div>

          <div className="text-right">
            <div className="text-xs text-gray-500">
              メイン機:{" "}
              {pattern.robots.filter((r) => r.skillLevel === "メイン機").length}
              機
            </div>
            <div className="text-xs text-gray-500">
              スキル値:{" "}
              {pattern.robots.reduce((sum, r) => sum + r.skillValue, 0)}
            </div>
            <div className="text-xs text-gray-500">
              効率:{" "}
              {(
                pattern.robots.reduce((sum, r) => sum + r.skillValue, 0) /
                pattern.pointUsage
              ).toFixed(2)}
            </div>
          </div>
        </div>

        {/* 代替パターン */}
        {pattern.alternatives &&
          pattern.alternatives.map((alt, index) => (
            <div key={index} className="relative">
              <div
                className="absolute left-0 top-0 bottom-0 w-px bg-gray-300"
                style={{ marginLeft: `${marginLeft + 12}px` }}
              />
              {renderPatternNode(alt, depth + 1)}
            </div>
          ))}
      </div>
    );
  };

  if (patterns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>チーム編成パターンツリー</span>
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
          <Users className="w-5 h-5 text-blue-600" />
          <span>チーム編成パターンツリー</span>
        </CardTitle>
        <CardDescription>
          {totalPointLimit}PT制限でのメイン機優先パターン表示
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            パターン例：プレイヤーA レシオ4（機体1, 2） → プレイヤーB
            レシオ3（機体3） または レシオ2（機体4） → プレイヤーC
            レシオ2（機体5, 6） または レシオ3（機体7）
          </h3>
          <div className="space-y-3">
            {patterns.map((pattern, index) => renderPatternNode(pattern, 0))}
          </div>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <div>💡 ヒント:</div>
          <div>• メイン機の数を最優先で選択</div>
          <div>
            • 各行は「プレイヤー + ポイント数 + 使用機体 + メイン機数」を表示
          </div>
          <div>• インデントされた行は代替パターンを表示</div>
          <div>• みんながメイン機を使えるパターンが理想的</div>
        </div>
      </CardContent>
    </Card>
  );
}
