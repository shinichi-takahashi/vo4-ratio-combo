"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUrlState } from "@/hooks/use-url-state";
import { Robot, SKILL_LEVELS, SkillLevel } from "@/types";
import { generateShareableUrl, copyUrlToClipboard } from "@/lib/url-state";
import {
  generateTeamPatternTree,
  generateBalancedPatterns,
} from "@/lib/optimization";
import { PlayerPointPatterns } from "@/components/player-point-patterns";
import { TeamPatternTree } from "@/components/team-pattern-tree";
import { AllPatternsTable } from "@/components/all-patterns-table-new";
import { TutorialDialog } from "@/components/tutorial-dialog";
import { encodePlayersToUrl } from "@/lib/url-state";
import { getRatioBadgeClass } from "@/lib/ratio-heatmap";
import { useDebounce } from "@/hooks/use-debounce";
import robotData from "@/data/robots.json";
import {
  Users,
  Settings,
  Share2,
  Copy,
  Plus,
  Minus,
  Rocket,
  Target,
  Zap,
  Flame,
  User,
  Trophy,
  Medal,
  ThumbsUp,
  HelpCircle,
  X,
  Lock,
  Settings2,
  TableIcon,
} from "lucide-react";

export default function Home() {
  const { players, isLoaded, addPlayer, removePlayer, updatePlayerSkill } =
    useUrlState();
  const [pointLimit, setPointLimit] = useState(9);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [playerPointPatterns, setPlayerPointPatterns] = useState<{
    playerPatterns: Array<{
      playerName: string;
      pointUsage: number;
      robots: any[];
      efficiency: number;
      description: string;
    }>;
  } | null>(null);
  const [teamPatternTree, setTeamPatternTree] = useState<Array<{
    playerName: string;
    pointUsage: number;
    robots: any[];
    alternatives?: Array<{
      playerName: string;
      pointUsage: number;
      robots: any[];
    }>;
  }> | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // 機体固定状態管理
  const [lockedRobots, setLockedRobots] = useState<Record<string, string>>({});
  // { "プレイヤー名": "機体名" } の形式

  // バランスパターンの状態管理
  const [balancedPatterns, setBalancedPatterns] = useState<any[]>([]);

  // 新しいプレイヤーを追加
  const handleAddPlayer = () => {
    if (newPlayerName.trim()) {
      addPlayer(newPlayerName.trim());
      setNewPlayerName("");
    }
  };

  // 機体固定/解除の関数
  const toggleRobotLock = useCallback(
    (playerName: string, robotName?: string) => {
      setLockedRobots((prev) => {
        const newLocked = { ...prev };
        if (robotName && newLocked[playerName] !== robotName) {
          // 機体を固定
          newLocked[playerName] = robotName;
        } else {
          // 固定を解除
          delete newLocked[playerName];
        }
        return newLocked;
      });
    },
    []
  );

  // スキルレベルを変更（メモ化）
  const handleSkillChange = useCallback(
    (playerId: number, robotName: string, newSkill: SkillLevel) => {
      updatePlayerSkill(playerId, robotName, newSkill);
    },
    [updatePlayerSkill]
  );

  // ロボットデータをメモ化
  const memoizedRobotData = useMemo(() => robotData as Robot[], []);

  // デバウンスしたプレイヤーデータ（遅延を最適化）
  const debouncedPlayers = useDebounce(players, 500);

  // プレイヤースキルデータの準備をメモ化
  const memoizedPlayersWithSkills = useMemo(() => {
    return debouncedPlayers.map((player) => ({
      ...player,
      skills: {
        ...memoizedRobotData.reduce((skills, robot) => {
          skills[robot.name] = player.skills[robot.name] || "使えない";
          return skills;
        }, {} as Record<string, SkillLevel>),
        ...player.skills,
      },
    }));
  }, [debouncedPlayers, memoizedRobotData]);

  // 結果表示用のref
  const teamResultRef = useRef<HTMLDivElement>(null);

  // 固定機体変更時の自動再計算
  const prevLockedRobotsRef = useRef<Record<string, string>>({});

  // アイコンヘルパー関数
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
        return <Trophy className="w-4 h-4 text-yellow-600" />;
      case "サブ機":
        return <Medal className="w-4 h-4 text-blue-600" />;
      case "一応乗れる":
        return <ThumbsUp className="w-4 h-4 text-green-600" />;
      case "自信なし":
        return <HelpCircle className="w-4 h-4 text-orange-600" />;
      case "使えない":
        return <X className="w-4 h-4 text-red-600" />;
    }
  };

  // URL共有
  const handleShareUrl = async () => {
    const success = await copyUrlToClipboard();
    setCopySuccess(success);
    setShareDialogOpen(true);

    if (success) {
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // 最適化計算を実行
  const handleCalculateOptimization = useCallback(async () => {
    setIsCalculating(true);

    try {
      // メモ化されたプレイヤーデータを使用
      const playersWithAllSkills = memoizedPlayersWithSkills;

      // ツリー状パターンも生成（固定機体を考慮）
      const treePatterns = generateTeamPatternTree(
        playersWithAllSkills,
        memoizedRobotData,
        pointLimit,
        lockedRobots
      );

      setTeamPatternTree(treePatterns);

      // バランスパターンを生成
      const balancePatterns = generateBalancedPatterns(
        playersWithAllSkills,
        memoizedRobotData,
        pointLimit,
        lockedRobots
      );
      setBalancedPatterns(balancePatterns);

      // 結果が表示されたら自動スクロール
      setTimeout(() => {
        if (teamResultRef.current) {
          teamResultRef.current.scrollIntoView({
            behavior: "smooth",
            block: "start",
            inline: "nearest",
          });
        }
      }, 100); // 結果のレンダリングを待つため少し遅延
    } catch (error) {
      console.error("Optimization calculation failed:", error);
    } finally {
      setIsCalculating(false);
    }
  }, [memoizedPlayersWithSkills, memoizedRobotData, pointLimit, lockedRobots]);

  // 固定機体変更時の自動再計算
  useEffect(() => {
    // 初回は実行しない
    const prevLocked = prevLockedRobotsRef.current;
    const hasChanged =
      JSON.stringify(prevLocked) !== JSON.stringify(lockedRobots);

    if (
      hasChanged &&
      Object.keys(prevLocked).length > 0 &&
      teamPatternTree &&
      players.length > 0
    ) {
      // 遅延を増やして過度な再計算を防止
      const timeoutId = setTimeout(async () => {
        await handleCalculateOptimization();
      }, 600);

      prevLockedRobotsRef.current = { ...lockedRobots };
      return () => clearTimeout(timeoutId);
    } else {
      prevLockedRobotsRef.current = { ...lockedRobots };
    }
  }, [
    lockedRobots,
    teamPatternTree,
    players.length,
    handleCalculateOptimization,
  ]);

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center space-y-6">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Settings className="w-8 h-8 text-blue-600 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-gray-800">
              🤖 システム初期化中...
            </div>
            <div className="text-lg text-gray-600">
              機体データを読み込んでいます ✨
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-600 to-indigo-700 shadow-lg py-12">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <h1 className="text-5xl font-bold mb-3 text-white flex items-center justify-center space-x-4 drop-shadow-lg">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Settings className="w-12 h-12 text-white" />
                  </div>
                  <span>VO4 レシオバトル編成ツール</span>
                </h1>
                <p className="text-xl text-blue-100 font-medium">
                  ✨ 最適なチーム編成を見つけよう！ 🚀
                </p>
              </div>
              <div className="flex items-start">
                <TutorialDialog />
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 pb-8 -mt-8 relative z-10">
          {/* コントロールパネル */}
          <Card className="mb-8 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-3 text-xl">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Settings className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-gray-800">⚙️ 設定パネル</span>
              </CardTitle>
              <CardDescription className="text-gray-600 ml-11">
                ポイント制限とプレイヤー管理 🎮
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* ポイント制限 */}
              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🎯</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <label
                        htmlFor="pointLimit"
                        className="text-sm font-semibold text-gray-700 cursor-help"
                      >
                        ポイント制限:
                      </label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>チーム全体で使用できる最大ポイント数です</p>
                      <p>大会ルールに合わせて調整してください</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  id="pointLimit"
                  type="number"
                  value={pointLimit}
                  onChange={(e) => setPointLimit(Number(e.target.value))}
                  className="w-24 shadow-sm border-purple-200 focus:border-purple-400 focus:ring-purple-200"
                  min="1"
                  max="50"
                />
                <span className="text-sm font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-md">
                  PT
                </span>
              </div>

              {/* プレイヤー管理 */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
                <h3 className="text-xl font-bold mb-6 flex items-center space-x-2 text-gray-800">
                  <span className="text-2xl">👥</span>
                  <span>プレイヤー管理</span>
                  <span className="text-sm bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                    {players.length}人
                  </span>
                </h3>
                <div className="space-y-4">
                  {players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-emerald-100 hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                          {getPlayerIcon(player.name)}
                        </div>
                        <span className="font-semibold text-gray-700">
                          {player.name}
                        </span>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removePlayer(player.id)}
                        disabled={players.length <= 1}
                        className="hover:bg-red-600 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}

                  {/* 新しいプレイヤー追加 */}
                  <div className="flex space-x-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border-2 border-dashed border-blue-200">
                    <Input
                      placeholder="🆕 新しいプレイヤー名を入力"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddPlayer()}
                      className="flex-1 border-blue-200 focus:border-blue-400 focus:ring-blue-200"
                    />
                    <Button
                      onClick={handleAddPlayer}
                      disabled={!newPlayerName.trim()}
                      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      ➕ 追加
                    </Button>
                  </div>
                </div>
              </div>

              {/* アクションボタン */}
              <div className="flex flex-wrap gap-4 p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200">
                <Dialog
                  open={shareDialogOpen}
                  onOpenChange={setShareDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      onClick={handleShareUrl}
                      variant="outline"
                      className="flex items-center space-x-2 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 shadow-sm"
                    >
                      <Share2 className="w-4 h-4 text-blue-600" />
                      <span>🔗 URL共有</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>URL共有</DialogTitle>
                      <DialogDescription>
                        以下のURLを他のメンバーに共有してください
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-3 bg-muted rounded-lg break-all text-sm">
                        {generateShareableUrl()}
                      </div>
                      {copySuccess && (
                        <div className="text-green-600 text-sm font-medium">
                          ✅ URLをクリップボードにコピーしました！
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="lg"
                      className="text-lg px-10 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                      onClick={handleCalculateOptimization}
                      disabled={isCalculating || players.length === 0}
                    >
                      {isCalculating ? (
                        <span className="flex items-center space-x-3">
                          <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                          <span>🔄 計算中...</span>
                        </span>
                      ) : (
                        <div className="flex items-center space-x-3">
                          <Rocket className="w-6 h-6" />
                          <span>✨ 最適編成を計算 🚀</span>
                        </div>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>プレイヤーのスキル設定に基づいて</p>
                    <p>最適なチーム編成を自動計算します</p>
                    <p>メイン機・サブ機を優先して提案します</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>

          {/* 機体テーブル */}
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-3 text-xl">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Settings className="w-6 h-6 text-amber-600" />
                </div>
                <span className="text-gray-800">🤖 機体データ管理</span>
              </CardTitle>
              <CardDescription className="text-gray-600 ml-11">
                各プレイヤーの機体習熟度を設定してください ⚙️
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-48">機体名</TableHead>
                      <TableHead className="w-20 text-center">レシオ</TableHead>
                      {players.map((player) => (
                        <TableHead
                          key={player.id}
                          className="text-center min-w-24"
                        >
                          {player.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {memoizedRobotData.map((robot) => (
                      <TableRow key={robot.name}>
                        <TableCell className="font-medium">
                          {robot.name}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={getRatioBadgeClass(robot.ratio)}>
                            {robot.ratio}
                          </Badge>
                        </TableCell>
                        {players.map((player) => {
                          const skill = player.skills[robot.name] || "使えない";
                          return (
                            <TableCell key={player.id} className="text-center">
                              <Select
                                value={skill}
                                onValueChange={(newSkill: SkillLevel) =>
                                  handleSkillChange(
                                    player.id,
                                    robot.name,
                                    newSkill
                                  )
                                }
                              >
                                <SelectTrigger className="w-36 h-8 text-xs">
                                  <SelectValue>
                                    <div className="flex items-center space-x-1">
                                      {getSkillIcon(skill)}
                                      <span>{skill}</span>
                                    </div>
                                  </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="使えない">
                                    <div className="flex items-center space-x-2">
                                      <X className="w-4 h-4 text-red-600" />
                                      <span>使えない</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="自信なし">
                                    <div className="flex items-center space-x-2">
                                      <HelpCircle className="w-4 h-4 text-orange-600" />
                                      <span>自信なし</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="一応乗れる">
                                    <div className="flex items-center space-x-2">
                                      <ThumbsUp className="w-4 h-4 text-green-600" />
                                      <span>一応乗れる</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="サブ機">
                                    <div className="flex items-center space-x-2">
                                      <Medal className="w-4 h-4 text-blue-600" />
                                      <span>サブ機</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem value="メイン機">
                                    <div className="flex items-center space-x-2">
                                      <Trophy className="w-4 h-4 text-yellow-600" />
                                      <span>メイン機</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* 全編成パターン表 */}
          {teamPatternTree && (
            <div ref={teamResultRef} className="mt-8">
              <Card className="animate-in slide-in-from-bottom-4 duration-500 shadow-xl border-0 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-sm">
                <CardHeader className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-t-lg border-b border-purple-100">
                  <CardTitle className="flex items-center space-x-3 text-2xl">
                    <div className="p-3 bg-violet-100 rounded-lg">
                      <TableIcon className="w-7 h-7 text-violet-600" />
                    </div>
                    <span className="text-gray-800">
                      🎯 チーム編成パターン表
                    </span>
                  </CardTitle>
                  <CardDescription className="text-gray-600 ml-12 text-lg">
                    ✨ {pointLimit}
                    PT制限での最適チーム編成組み合わせ（メイン機数優先順） 🚀
                  </CardDescription>
                </CardHeader>

                {/* プレイヤー別機体固定設定 */}
                <CardContent className="border-t border-purple-100 mt-6 pt-6">
                  <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Settings2 className="w-5 h-5 text-orange-600" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">
                        🔒 機体固定設定（任意）
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 ml-12">
                      特定のプレイヤーの機体を固定して、残りのプレイヤーの最適編成を提案できます
                      ✨
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {players.map((player) => (
                      <div
                        key={player.id}
                        className="space-y-2 p-3 bg-white rounded-lg border border-gray-200 shadow-sm"
                      >
                        <label className="text-sm font-semibold text-gray-700 flex items-center space-x-2">
                          <div className="p-1 bg-blue-100 rounded">
                            {getPlayerIcon(player.name)}
                          </div>
                          <span>{player.name}</span>
                        </label>
                        <Select
                          value={lockedRobots[player.name] || "none"}
                          onValueChange={(value) => {
                            if (value === "none") {
                              toggleRobotLock(player.name); // 固定解除
                            } else {
                              toggleRobotLock(player.name, value); // 機体固定
                            }
                          }}
                        >
                          <SelectTrigger className="w-full bg-white h-9 text-xs border-gray-300 focus:border-blue-400 focus:ring-blue-200">
                            <SelectValue placeholder="🔓 機体を選択" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              <div className="flex items-center space-x-2">
                                <span className="text-gray-500">
                                  固定しない
                                </span>
                              </div>
                            </SelectItem>
                            {memoizedRobotData
                              .filter((robot) => {
                                const skill =
                                  player.skills[robot.name] || "使えない";
                                return skill !== "使えない";
                              })
                              .sort((a, b) => {
                                const skillA =
                                  player.skills[a.name] || "使えない";
                                const skillB =
                                  player.skills[b.name] || "使えない";

                                // スキルレベルの優先順位
                                const skillOrder = {
                                  メイン機: 0,
                                  サブ機: 1,
                                  一応乗れる: 2,
                                  自信なし: 3,
                                };

                                const orderA =
                                  skillOrder[
                                    skillA as keyof typeof skillOrder
                                  ] ?? 999;
                                const orderB =
                                  skillOrder[
                                    skillB as keyof typeof skillOrder
                                  ] ?? 999;

                                // 同じスキルレベルの場合はレシオ順（低い方が先）
                                if (orderA === orderB) {
                                  return a.ratio - b.ratio;
                                }

                                return orderA - orderB;
                              })
                              .map((robot) => {
                                const skill =
                                  player.skills[robot.name] || "使えない";
                                return (
                                  <SelectItem
                                    key={robot.name}
                                    value={robot.name}
                                  >
                                    <div className="flex items-center space-x-2">
                                      {skill === "メイン機" && (
                                        <Trophy className="w-3 h-3 text-yellow-600" />
                                      )}
                                      {skill === "サブ機" && (
                                        <Medal className="w-3 h-3 text-blue-600" />
                                      )}
                                      {skill === "一応乗れる" && (
                                        <ThumbsUp className="w-3 h-3 text-green-600" />
                                      )}
                                      {skill === "自信なし" && (
                                        <HelpCircle className="w-3 h-3 text-orange-600" />
                                      )}
                                      <span className="font-medium text-xs">
                                        {robot.name}
                                      </span>
                                      <Badge
                                        className="ml-1 text-xs"
                                        variant="secondary"
                                      >
                                        {robot.ratio}PT
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                );
                              })}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>

                  {Object.keys(lockedRobots).length > 0 && (
                    <div className="mt-3 p-2">
                      <div className="text-xs font-medium text-gray-600 mb-1">
                        🔒 固定中
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(lockedRobots).map(
                          ([playerName, robotName]) => (
                            <Badge
                              key={`${playerName}-${robotName}`}
                              variant="default"
                              className="bg-gray-600 text-xs"
                            >
                              <Lock className="w-2 h-2 mr-1" />
                              {playerName}: {robotName}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>

                {/* 編成パターン表本体 */}
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {/* パターン表示 */}
                    <AllPatternsTable
                      patterns={balancedPatterns}
                      totalPointLimit={pointLimit}
                      playerNames={players.map((p) => p.name)}
                      lockedRobots={lockedRobots}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* プレイヤー別ポイント使用パターン（将来の拡張用）
        {playerPointPatterns && (
          <PlayerPointPatterns patterns={playerPointPatterns.playerPatterns} />
        )}
        */}
        </main>
      </div>
    </TooltipProvider>
  );
}
