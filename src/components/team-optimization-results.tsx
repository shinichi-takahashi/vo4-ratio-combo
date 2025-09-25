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
  Sparkles,
  AlertTriangle,
  Bot,
} from "lucide-react";

interface TeamOptimizationResultsProps {
  assignments: Record<string, RobotWithSkill[]>;
  totalPoints: number;
  totalSkillValue: number;
  efficiency: number;
  pointLimit: number;
}

export function TeamOptimizationResults({
  assignments,
  totalPoints,
  totalSkillValue,
  efficiency,
  pointLimit,
}: TeamOptimizationResultsProps) {
  const players = Object.keys(assignments);

  // プレイヤーが存在しない場合
  if (players.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bot className="w-5 h-5 text-blue-600" />
            <span>チーム最適化結果</span>
          </CardTitle>
          <CardDescription>プレイヤーデータが不足しています</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // 有効な組み合わせがない場合
  const playersWithAssignments = Object.values(assignments).filter(
    (robotList) => robotList.length > 0
  ).length;

  if (totalPoints === 0 && playersWithAssignments === 0) {
    return (
      <Card className="animate-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <span>有効な組み合わせがありません</span>
          </CardTitle>
          <CardDescription>
            ポイント制限 {pointLimit}PT
            内で、各プレイヤーの使用可能機体での組み合わせが見つかりませんでした。
            スキルレベルを見直すか、ポイント制限を調整してください。
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="animate-in slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <span>チーム最適化結果</span>
        </CardTitle>
        <CardDescription>
          ポイント制限 {pointLimit}PT でのチーム全体の最適編成
        </CardDescription>
        <div className="flex space-x-4 mt-2">
          <Badge variant="outline" className="text-lg">
            合計: {totalPoints}PT / {pointLimit}PT
          </Badge>
          <Badge variant="secondary" className="text-lg">
            チームスキル値: {totalSkillValue}
          </Badge>
          <Badge className="bg-purple-500 text-lg">
            効率: {efficiency.toFixed(2)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {players.map((playerName) => (
          <PlayerAssignmentCard
            key={playerName}
            playerName={playerName}
            robots={assignments[playerName]}
          />
        ))}
      </CardContent>
    </Card>
  );
}

function PlayerAssignmentCard({
  playerName,
  robots,
}: {
  playerName: string;
  robots: RobotWithSkill[];
}) {
  const totalPlayerPoints = robots.reduce((sum, robot) => sum + robot.ratio, 0);
  const totalPlayerSkillValue = robots.reduce(
    (sum, robot) => sum + robot.skillValue,
    0
  );

  const getPlayerIcon = (name: string) => {
    if (name.includes("あんのーん"))
      return <Target className="w-4 h-4 text-blue-600" />;
    if (name.includes("おたいき"))
      return <Zap className="w-4 h-4 text-yellow-600" />;
    if (name.includes("たっちん"))
      return <Flame className="w-4 h-4 text-red-600" />;
    return <User className="w-4 h-4 text-gray-600" />;
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center space-x-2">
            {getPlayerIcon(playerName)}
            <span>{playerName}</span>
          </CardTitle>
          <div className="flex space-x-2">
            <Badge variant="outline">{totalPlayerPoints}PT</Badge>
            <Badge variant="secondary">スキル値: {totalPlayerSkillValue}</Badge>
            {robots.length > 0 && (
              <Badge className="bg-green-500">{robots.length}機体</Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {robots.length > 0 ? (
          <div className="space-y-2">
            {robots.map((robot) => (
              <RobotAssignmentRow key={robot.name} robot={robot} />
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground text-sm">
              😴 このプレイヤーには機体が割り当てられませんでした
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              チーム全体の効率を考慮した結果、他のプレイヤーが機体を使用します
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RobotAssignmentRow({ robot }: { robot: RobotWithSkill }) {
  const skillColors = {
    メイン機: "bg-green-500",
    サブ機: "bg-blue-500",
    一応乗れる: "bg-yellow-500",
    自信なし: "bg-orange-500",
    使えない: "bg-red-500",
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
      case "使えない":
        return <X className="w-4 h-4 text-red-600" />;
      default:
        return <HelpCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-muted/50 rounded-lg">
      <div className="flex items-center space-x-2">
        {getSkillIcon(robot.skillLevel)}
        <span className="font-medium text-sm">{robot.name}</span>
      </div>
      <div className="flex items-center space-x-2">
        <Badge className={getRatioBadgeClass(robot.ratio)}>
          R:{robot.ratio}
        </Badge>
        <Badge
          className={`${skillColors[robot.skillLevel]} text-white text-xs`}
        >
          {robot.skillLevel}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          +{robot.skillValue}
        </Badge>
      </div>
    </div>
  );
}
