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
import { useUrlState } from "@/hooks/use-url-state";
import { Robot, SKILL_LEVELS, SkillLevel } from "@/types";
import { generateShareableUrl, copyUrlToClipboard } from "@/lib/url-state";
import {
  generateTeamPatternTree,
  generatePlayerPriorityPatterns,
  generateBalancedPatterns,
} from "@/lib/optimization";
import { PlayerPointPatterns } from "@/components/player-point-patterns";
import { TeamPatternTree } from "@/components/team-pattern-tree";
import { AllPatternsTable } from "@/components/all-patterns-table-new";
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

  // パターン表示タブの状態管理
  const [selectedPatternType, setSelectedPatternType] =
    useState<string>("balance");

  // プレイヤー優先パターンの状態管理
  const [playerPriorityPatterns, setPlayerPriorityPatterns] = useState<
    Record<number, any[]>
  >({});

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

  // パターン選択変更時の処理
  const handlePatternTypeChange = useCallback(
    (value: string) => {
      setSelectedPatternType(value);

      // プレイヤー優先が選択された場合で、まだ計算されていない場合は再計算
      if (
        value.startsWith("player-") &&
        players.length > 0 &&
        memoizedRobotData.length > 0
      ) {
        const playerId = parseInt(value.replace("player-", ""));
        if (
          !playerPriorityPatterns[playerId] ||
          playerPriorityPatterns[playerId].length === 0
        ) {
          // 必要に応じて個別に計算
          const priorityPatterns = generatePlayerPriorityPatterns(
            players,
            memoizedRobotData,
            pointLimit,
            playerId,
            lockedRobots
          );
          setPlayerPriorityPatterns((prev) => ({
            ...prev,
            [playerId]: priorityPatterns,
          }));
        }
      }
    },
    [
      players,
      memoizedRobotData,
      pointLimit,
      lockedRobots,
      playerPriorityPatterns,
    ]
  );

  // デバウンスしたプレイヤーデータ
  const debouncedPlayers = useDebounce(players, 300);

  // 結果表示用のref
  const teamResultRef = useRef<HTMLDivElement>(null);

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
  const handleCalculateOptimization = async () => {
    setIsCalculating(true);

    try {
      // 全機体のスキルデータを初期化
      const playersWithAllSkills = debouncedPlayers.map((player) => ({
        ...player,
        skills: {
          ...memoizedRobotData.reduce((skills, robot) => {
            skills[robot.name] = player.skills[robot.name] || "使えない";
            return skills;
          }, {} as Record<string, SkillLevel>),
          ...player.skills,
        },
      }));

      // ツリー状パターンも生成（固定機体を考慮）
      const treePatterns = generateTeamPatternTree(
        playersWithAllSkills,
        memoizedRobotData,
        pointLimit,
        lockedRobots
      );

      setTeamPatternTree(treePatterns);

      // バランスパターンを生成（メイン・サブ機優先）
      const balancePatterns = generateBalancedPatterns(
        playersWithAllSkills,
        memoizedRobotData,
        pointLimit,
        lockedRobots
      );
      setBalancedPatterns(balancePatterns);

      // プレイヤー優先パターンも生成
      const priorityPatterns: Record<number, any[]> = {};
      playersWithAllSkills.forEach((player) => {
        priorityPatterns[player.id] = generatePlayerPriorityPatterns(
          playersWithAllSkills,
          memoizedRobotData,
          pointLimit,
          player.id,
          lockedRobots
        );
      });
      setPlayerPriorityPatterns(priorityPatterns);

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
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600 text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-2 text-gray-900 flex items-center justify-center space-x-3">
            <Settings className="w-10 h-10 text-blue-600" />
            <span>VO4 レシオバトル編成ツール</span>
          </h1>
          <p className="text-xl text-gray-600">
            最適なチーム編成を見つけよう！
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-8">
        {/* コントロールパネル */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <span>設定</span>
            </CardTitle>
            <CardDescription>ポイント制限とプレイヤー管理</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* ポイント制限 */}
            <div className="flex items-center space-x-4">
              <label htmlFor="pointLimit" className="text-sm font-medium">
                ポイント制限:
              </label>
              <Input
                id="pointLimit"
                type="number"
                value={pointLimit}
                onChange={(e) => setPointLimit(Number(e.target.value))}
                className="w-20"
                min="1"
                max="50"
              />
              <span className="text-sm text-muted-foreground">PT</span>
            </div>

            {/* プレイヤー管理 */}
            <div>
              <h3 className="text-lg font-semibold mb-4">👥 プレイヤー管理</h3>
              <div className="space-y-3">
                {players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between bg-muted rounded-lg p-3"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removePlayer(player.id)}
                      disabled={players.length <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {/* 新しいプレイヤー追加 */}
                <div className="flex space-x-2">
                  <Input
                    placeholder="プレイヤー名"
                    value={newPlayerName}
                    onChange={(e) => setNewPlayerName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddPlayer()}
                  />
                  <Button
                    onClick={handleAddPlayer}
                    disabled={!newPlayerName.trim()}
                  >
                    ➕ 追加
                  </Button>
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex flex-wrap gap-4">
              <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleShareUrl}>🔗 URL共有</Button>
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

              <Button
                size="lg"
                className="bg-green-600 hover:bg-green-700 transition-all duration-200"
                onClick={handleCalculateOptimization}
                disabled={isCalculating || players.length === 0}
              >
                {isCalculating ? (
                  <span className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>計算中...</span>
                  </span>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Rocket className="w-4 h-4" />
                    <span>最適編成を計算</span>
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 機体テーブル */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-gray-600" />
              <span>機体データ</span>
            </CardTitle>
            <CardDescription>
              各プレイヤーの機体習熟度を設定してください
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
            <Card className="animate-in slide-in-from-bottom-4 duration-500">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TableIcon className="w-5 h-5 text-blue-600" />
                  <span>チーム編成パターン表</span>
                </CardTitle>
                <CardDescription>
                  {pointLimit}
                  PT制限でのチーム編成組み合わせ（1行1編成パターン、メイン機数順）
                </CardDescription>
              </CardHeader>

              {/* プレイヤー別機体固定設定 */}
              <CardContent className="">
                <div className="mb-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Settings2 className="w-4 h-4 text-gray-500" />
                    <h3 className="text-sm font-semibold text-gray-700">
                      機体固定設定（任意）
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 mb-4">
                    特定のプレイヤーの機体を固定して、残りのプレイヤーの最適編成を提案できます
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {players.map((player) => (
                      <div key={player.id} className="space-y-1">
                        <label className="text-xs font-medium text-gray-700">
                          {player.name}
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
                          <SelectTrigger className="w-full bg-white h-8 text-xs">
                            <SelectValue placeholder="機体を選択" />
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
                </div>
              </CardContent>

              {/* 編成パターン表本体 */}
              <CardContent className="pt-0">
                <div className="space-y-4">
                  {/* パターン選択ドロップダウン */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">編成優先設定:</label>
                    <Select
                      value={selectedPatternType}
                      onValueChange={handlePatternTypeChange}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="パターンを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="balance">バランス</SelectItem>
                        {players.map((player) => (
                          <SelectItem
                            key={player.id}
                            value={`player-${player.id}`}
                          >
                            {player.name}優先
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* パターン表示 */}
                  <AllPatternsTable
                    patterns={
                      selectedPatternType === "balance"
                        ? balancedPatterns
                        : players.find(
                            (p) => `player-${p.id}` === selectedPatternType
                          )
                        ? playerPriorityPatterns[
                            players.find(
                              (p) => `player-${p.id}` === selectedPatternType
                            )!.id
                          ] || []
                        : []
                    }
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
  );
}
