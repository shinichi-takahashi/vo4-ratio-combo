"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  OptimizationResult,
  PriorityOptimizationResult,
  RobotWithSkill,
} from "@/lib/optimization";
import { getRatioBadgeClass } from "@/lib/ratio-heatmap";

interface OptimizationResultsProps {
  standardResults: OptimizationResult[];
  priorityPatterns: PriorityOptimizationResult[];
  pointLimit: number;
}

export function OptimizationResults({
  standardResults,
  priorityPatterns,
  pointLimit,
}: OptimizationResultsProps) {
  const [activeTab, setActiveTab] = useState<"standard" | "priority">(
    "standard"
  );

  if (standardResults.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>🤖 最適化結果</CardTitle>
          <CardDescription>プレイヤーデータが不足しています</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>✨ 最適化結果</CardTitle>
        <CardDescription>
          ポイント制限 {pointLimit}PT での最適な編成
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* タブ切り替え */}
        <div className="flex space-x-2">
          <Button
            variant={activeTab === "standard" ? "default" : "outline"}
            onClick={() => setActiveTab("standard")}
          >
            🎯 標準最適化
          </Button>
          <Button
            variant={activeTab === "priority" ? "default" : "outline"}
            onClick={() => setActiveTab("priority")}
          >
            👑 プレイヤー優先
          </Button>
        </div>

        {/* 標準最適化結果 */}
        {activeTab === "standard" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">各プレイヤーの最適編成</h3>
            {standardResults.map((result, index) => (
              <StandardResultCard
                key={result.player}
                result={result}
                rank={index + 1}
              />
            ))}
          </div>
        )}

        {/* プレイヤー優先結果 */}
        {activeTab === "priority" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">プレイヤー優先パターン</h3>
            {priorityPatterns.map((pattern) => (
              <PriorityResultCard
                key={pattern.priorityPlayer}
                pattern={pattern}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StandardResultCard({
  result,
  rank,
}: {
  result: OptimizationResult;
  rank: number;
}) {
  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return "🏅";
    }
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {getRankEmoji(rank)} {result.player}
          </CardTitle>
          <div className="flex space-x-2">
            <Badge variant="outline">
              {result.totalPoints}/
              {result.combination.length > 0
                ? result.combination.reduce((sum, r) => sum + r.ratio, 0)
                : 0}
              PT
            </Badge>
            <Badge variant="secondary">
              スキル値: {result.totalSkillValue}
            </Badge>
            <Badge className="bg-purple-500">
              効率: {result.efficiency.toFixed(2)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {result.combination.length > 0 ? (
          <div className="space-y-2">
            {result.combination.map((robot) => (
              <RobotRow key={robot.name} robot={robot} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">
            使用可能な機体がありません
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function PriorityResultCard({
  pattern,
}: {
  pattern: PriorityOptimizationResult;
}) {
  return (
    <Card className="border-l-4 border-l-green-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            👑 {pattern.priorityPlayer} 優先編成
          </CardTitle>
          <Badge variant="outline">
            チーム合計: {pattern.totalTeamPoints}PT
          </Badge>
        </div>
        <CardDescription>{pattern.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 優先プレイヤーの機体 */}
        <div>
          <h4 className="font-medium text-sm text-green-600 mb-2">
            {pattern.priorityPlayer} の編成
          </h4>
          {pattern.priorityRobots.length > 0 ? (
            <div className="space-y-1">
              {pattern.priorityRobots.map((robot) => (
                <RobotRow key={robot.name} robot={robot} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">割り当て機体なし</p>
          )}
        </div>

        {/* 他のプレイヤーの編成 */}
        <div className="grid gap-3">
          {pattern.otherPlayers.map((result) => (
            <div
              key={result.player}
              className="border rounded-lg p-3 bg-muted/50"
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm">{result.player}</h4>
                <div className="flex space-x-1">
                  <Badge variant="outline" className="text-xs">
                    {result.totalPoints}PT
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {result.totalSkillValue}
                  </Badge>
                </div>
              </div>
              {result.combination.length > 0 ? (
                <div className="space-y-1">
                  {result.combination.map((robot) => (
                    <RobotRow key={robot.name} robot={robot} compact />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs">
                  使用可能な機体がありません
                </p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function RobotRow({
  robot,
  compact = false,
}: {
  robot: RobotWithSkill;
  compact?: boolean;
}) {
  const skillColors = {
    メイン機: "bg-green-500",
    サブ機: "bg-blue-500",
    一応乗れる: "bg-yellow-500",
    自信なし: "bg-orange-500",
    使えない: "bg-red-500",
  };

  return (
    <div
      className={`flex items-center justify-between ${
        compact ? "py-0.5" : "py-1"
      }`}
    >
      <span className={`font-medium ${compact ? "text-xs" : "text-sm"}`}>
        {robot.name}
      </span>
      <div className="flex items-center space-x-1">
        <Badge
          className={`${getRatioBadgeClass(robot.ratio)} ${
            compact ? "text-xs" : ""
          }`}
        >
          R:{robot.ratio}
        </Badge>
        <Badge
          className={`${skillColors[robot.skillLevel]} text-white ${
            compact ? "text-xs" : ""
          }`}
        >
          {robot.skillLevel}
        </Badge>
        <Badge variant="secondary" className={compact ? "text-xs" : ""}>
          {robot.skillValue}
        </Badge>
      </div>
    </div>
  );
}
