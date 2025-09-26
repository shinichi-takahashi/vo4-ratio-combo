import { Player, Robot, SKILL_LEVELS, SkillLevel } from "@/types";

export interface RobotWithSkill extends Robot {
  skillValue: number;
  playerName: string;
  skillLevel: SkillLevel;
}

export interface OptimizationResult {
  player: string;
  combination: RobotWithSkill[];
  totalPoints: number;
  totalSkillValue: number;
  efficiency: number; // スキル値/ポイント比
}

export interface PriorityOptimizationResult {
  priorityPlayer: string;
  priorityRobots: RobotWithSkill[];
  otherPlayers: OptimizationResult[];
  totalTeamPoints: number;
  description: string;
}

// 単一プレイヤーの最適解を計算（固定機体対応）
export function calculateOptimalCombination(
  player: Player,
  robots: Robot[],
  pointLimit: number,
  lockedRobots?: Record<string, string>
): OptimizationResult {
  // 固定された機体をチェック
  const playerLockedRobot = lockedRobots?.[player.name];

  // プレイヤーが使用可能な機体をフィルタリング
  const availableRobots: RobotWithSkill[] = robots
    .map((robot) => {
      const skill = player.skills[robot.name] || "使えない";
      const skillValue = SKILL_LEVELS[skill].value;

      return {
        ...robot,
        skillValue,
        playerName: player.name,
        skillLevel: skill,
      };
    })
    .filter((robot) => {
      // 使えない機体を除外
      if (robot.skillValue <= 0) return false;

      // 固定機体がある場合、それ以外は除外
      if (playerLockedRobot) {
        return robot.name === playerLockedRobot;
      }

      // 他のプレイヤーに固定されている機体は除外
      if (lockedRobots) {
        const isLockedByOther = Object.entries(lockedRobots).some(
          ([otherPlayer, robotName]) =>
            otherPlayer !== player.name && robotName === robot.name
        );
        if (isLockedByOther) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // スキル値が高い順、同じならレシオが低い順（効率重視）
      if (b.skillValue !== a.skillValue) {
        return b.skillValue - a.skillValue;
      }
      return a.ratio - b.ratio;
    });

  // 動的プログラミングで最適解を計算
  const dp: Array<{ value: number; robots: RobotWithSkill[] }> = Array(
    pointLimit + 1
  ).fill({ value: 0, robots: [] });

  for (let i = 0; i <= pointLimit; i++) {
    dp[i] = { value: 0, robots: [] };
  }

  for (const robot of availableRobots) {
    for (let points = pointLimit; points >= robot.ratio; points--) {
      const newValue = dp[points - robot.ratio].value + robot.skillValue;
      if (newValue > dp[points].value) {
        dp[points] = {
          value: newValue,
          robots: [...dp[points - robot.ratio].robots, robot],
        };
      }
    }
  }

  const bestCombination = dp[pointLimit];
  const totalPoints = bestCombination.robots.reduce(
    (sum, robot) => sum + robot.ratio,
    0
  );

  return {
    player: player.name,
    combination: bestCombination.robots,
    totalPoints,
    totalSkillValue: bestCombination.value,
    efficiency: totalPoints > 0 ? bestCombination.value / totalPoints : 0,
  };
}

// チーム全体での最適解を計算
export function calculateTeamOptimalCombination(
  players: Player[],
  robots: Robot[],
  pointLimit: number,
  lockedRobots?: Record<string, string>
): {
  assignments: Record<string, RobotWithSkill[]>;
  totalPoints: number;
  totalSkillValue: number;
  efficiency: number;
} {
  // 各プレイヤーが使用可能な機体とスキル値を計算（固定機体対応）
  const playerRobots: Record<string, RobotWithSkill[]> = {};

  players.forEach((player) => {
    const playerLockedRobot = lockedRobots?.[player.name];

    playerRobots[player.name] = robots
      .map((robot) => {
        const skill = player.skills[robot.name] || "使えない";
        const skillValue = SKILL_LEVELS[skill].value;

        return {
          ...robot,
          skillValue,
          playerName: player.name,
          skillLevel: skill,
        };
      })
      .filter((robot) => {
        // 使えない機体を除外
        if (robot.skillValue <= 0) return false;

        // 固定機体がある場合、それ以外は除外
        if (playerLockedRobot) {
          return robot.name === playerLockedRobot;
        }

        // 他のプレイヤーに固定されている機体は除外
        if (lockedRobots) {
          const isLockedByOther = Object.entries(lockedRobots).some(
            ([otherPlayer, robotName]) =>
              otherPlayer !== player.name && robotName === robot.name
          );
          if (isLockedByOther) return false;
        }

        return true;
      });
  });

  // 全ての可能な組み合わせを生成（各機体を誰が使うか）
  const allCombinations: Array<{
    assignments: Record<string, RobotWithSkill[]>;
    totalPoints: number;
    totalSkillValue: number;
  }> = [];

  // チーム全体でのポイント制限を満たす最適解を探索
  function findOptimalTeamAssignment(): {
    assignments: Record<string, RobotWithSkill[]>;
    totalPoints: number;
    totalSkillValue: number;
  } {
    // 初期化
    const assignments: Record<string, RobotWithSkill[]> = {};
    players.forEach((player) => {
      assignments[player.name] = [];
    });

    // 全プレイヤーの使用可能機体をリストアップ
    const allCandidates: Array<{
      player: string;
      robot: RobotWithSkill;
      efficiency: number;
    }> = [];

    players.forEach((player) => {
      const availableRobots = playerRobots[player.name] || [];
      availableRobots
        .filter((robot) => robot.skillValue > 0)
        .forEach((robot) => {
          allCandidates.push({
            player: player.name,
            robot: robot,
            efficiency: robot.skillValue / robot.ratio,
          });
        });
    });

    // 効率順でソート（スキル値/レシオ比が高い順）
    allCandidates.sort((a, b) => b.efficiency - a.efficiency);

    let currentPoints = 0;
    let currentSkillValue = 0;
    const usedRobots = new Set<string>();

    // 貪欲法でチーム全体のポイント制限内で最適化
    for (const candidate of allCandidates) {
      const newPoints = currentPoints + candidate.robot.ratio;

      // ポイント制限内で、まだ使われていない機体の場合
      if (newPoints <= pointLimit && !usedRobots.has(candidate.robot.name)) {
        // 安全チェック
        if (!assignments[candidate.player]) {
          assignments[candidate.player] = [];
        }

        assignments[candidate.player].push(candidate.robot);
        usedRobots.add(candidate.robot.name);
        currentPoints = newPoints;
        currentSkillValue += candidate.robot.skillValue;
      }
    }

    // 結果の妥当性チェック
    if (currentPoints === 0) {
      console.warn("No valid team combination found within point limit");
    }

    return {
      assignments,
      totalPoints: currentPoints,
      totalSkillValue: currentSkillValue,
    };
  }

  // 効率的なアルゴリズムで最適解を計算
  let bestCombination;
  try {
    bestCombination = findOptimalTeamAssignment();
  } catch (error) {
    console.error("Optimization failed:", error);
    // フォールバック: 空の結果を返す
    const initialAssignments: Record<string, RobotWithSkill[]> = {};
    players.forEach((player) => {
      initialAssignments[player.name] = [];
    });
    bestCombination = {
      assignments: initialAssignments,
      totalPoints: 0,
      totalSkillValue: 0,
    };
  }

  return {
    assignments: bestCombination.assignments,
    totalPoints: bestCombination.totalPoints,
    totalSkillValue: bestCombination.totalSkillValue,
    efficiency:
      bestCombination.totalPoints > 0
        ? bestCombination.totalSkillValue / bestCombination.totalPoints
        : 0,
  };
}

// 個人別の最適解を計算（従来の機能として残す）
export function calculateAllOptimalCombinations(
  players: Player[],
  robots: Robot[],
  pointLimit: number,
  lockedRobots?: Record<string, string>
): OptimizationResult[] {
  return players
    .map((player) =>
      calculateOptimalCombination(player, robots, pointLimit, lockedRobots)
    )
    .sort((a, b) => b.totalSkillValue - a.totalSkillValue); // スキル値が高い順
}

// 特定プレイヤーを優先した最適解を計算
export function calculatePriorityOptimization(
  players: Player[],
  robots: Robot[],
  pointLimit: number,
  priorityPlayer: Player,
  priorityRobotNames: string[] = [],
  lockedRobots?: Record<string, string>
): PriorityOptimizationResult {
  // 優先プレイヤーの機体を確定
  let priorityRobots: RobotWithSkill[] = [];
  let remainingPoints = pointLimit;

  if (priorityRobotNames.length > 0) {
    // 指定された機体を優先プレイヤーに割り当て
    priorityRobots = priorityRobotNames
      .map((robotName) => {
        const robot = robots.find((r) => r.name === robotName);
        if (!robot) return null;

        const skill = priorityPlayer.skills[robotName] || "使えない";
        const skillValue = SKILL_LEVELS[skill].value;

        return {
          ...robot,
          skillValue,
          playerName: priorityPlayer.name,
          skillLevel: skill,
        };
      })
      .filter((robot): robot is RobotWithSkill => robot !== null);

    remainingPoints -= priorityRobots.reduce(
      (sum, robot) => sum + robot.ratio,
      0
    );
  } else {
    // 優先プレイヤーのメイン機・サブ機を優先的に割り当て
    const prioritySkills: SkillLevel[] = ["メイン機", "サブ機"];
    const candidateRobots = robots
      .map((robot) => {
        const skill = priorityPlayer.skills[robot.name] || "使えない";
        const skillValue = SKILL_LEVELS[skill].value;

        return {
          ...robot,
          skillValue,
          playerName: priorityPlayer.name,
          skillLevel: skill,
        };
      })
      .filter(
        (robot) =>
          prioritySkills.includes(robot.skillLevel) && robot.skillValue > 0
      )
      .sort((a, b) => {
        // メイン機 > サブ機 > レシオ効率順
        if (a.skillLevel !== b.skillLevel) {
          return (
            prioritySkills.indexOf(a.skillLevel) -
            prioritySkills.indexOf(b.skillLevel)
          );
        }
        return b.skillValue / b.ratio - a.skillValue / a.ratio;
      });

    // 可能な限り優先機体を選択
    for (const robot of candidateRobots) {
      if (remainingPoints >= robot.ratio) {
        priorityRobots.push(robot);
        remainingPoints -= robot.ratio;
      }
    }
  }

  // 残りのプレイヤーで最適解を計算
  const otherPlayers = players
    .filter((player) => player.id !== priorityPlayer.id)
    .map((player) =>
      calculateOptimalCombination(player, robots, pointLimit, lockedRobots)
    );

  const totalTeamPoints =
    priorityRobots.reduce((sum, robot) => sum + robot.ratio, 0) +
    otherPlayers.reduce((sum, result) => sum + result.totalPoints, 0);

  return {
    priorityPlayer: priorityPlayer.name,
    priorityRobots,
    otherPlayers,
    totalTeamPoints,
    description: `${priorityPlayer.name}が${
      priorityRobotNames.length > 0 ? "指定機体" : "得意機体"
    }を優先使用`,
  };
}

// プレイヤー別ポイント使用パターンを生成
export function generatePlayerPointPatterns(
  players: Player[],
  robots: Robot[],
  totalPointLimit: number
): {
  playerPatterns: Array<{
    playerName: string;
    pointUsage: number;
    robots: RobotWithSkill[];
    efficiency: number;
    description: string;
  }>;
} {
  const playerPatterns: Array<{
    playerName: string;
    pointUsage: number;
    robots: RobotWithSkill[];
    efficiency: number;
    description: string;
  }> = [];

  players.forEach((player) => {
    // 各プレイヤーが使用可能な機体の組み合わせを計算
    const playerRobots = robots
      .map((robot) => {
        const skill = player.skills[robot.name] || "使えない";
        const skillValue = SKILL_LEVELS[skill].value;

        return {
          ...robot,
          skillValue,
          playerName: player.name,
          skillLevel: skill,
        };
      })
      .filter((robot) => robot.skillValue > 0)
      .sort((a, b) => b.skillValue / b.ratio - a.skillValue / a.ratio);

    // 異なるポイント使用量でのパターンを生成
    const maxPlayerPoints = Math.min(
      totalPointLimit,
      playerRobots.reduce((sum, robot) => sum + robot.ratio, 0)
    );

    // 1PTから最大可能ポイントまでの最適な組み合わせを計算
    for (let points = 1; points <= maxPlayerPoints; points++) {
      const combination = findBestCombinationForPoints(playerRobots, points);

      if (
        combination.robots.length > 0 &&
        combination.totalPoints <= totalPointLimit
      ) {
        const efficiency =
          combination.totalSkillValue / combination.totalPoints;

        playerPatterns.push({
          playerName: player.name,
          pointUsage: combination.totalPoints,
          robots: combination.robots,
          efficiency,
          description: `${player.name}が${combination.totalPoints}PT使用する場合`,
        });
      }
    }
  });

  // 効率順でソートして、各プレイヤーの代表的なパターンを選出
  const representativePatterns: typeof playerPatterns = [];

  players.forEach((player) => {
    const playerResults = playerPatterns
      .filter((p) => p.playerName === player.name)
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 3); // 各プレイヤーの上位3パターン

    representativePatterns.push(...playerResults);
  });

  return {
    playerPatterns: representativePatterns,
  };
}

// 指定されたポイント数での最適な機体組み合わせを見つける
function findBestCombinationForPoints(
  robots: RobotWithSkill[],
  targetPoints: number
): {
  robots: RobotWithSkill[];
  totalPoints: number;
  totalSkillValue: number;
} {
  let bestCombination = {
    robots: [] as RobotWithSkill[],
    totalPoints: 0,
    totalSkillValue: 0,
  };

  // 動的プログラミングで最適解を探索
  const dp: Array<{
    robots: RobotWithSkill[];
    skillValue: number;
  }> = new Array(targetPoints + 1).fill(null).map(() => ({
    robots: [],
    skillValue: 0,
  }));

  for (const robot of robots) {
    for (let points = targetPoints; points >= robot.ratio; points--) {
      const newSkillValue =
        dp[points - robot.ratio].skillValue + robot.skillValue;

      if (newSkillValue > dp[points].skillValue) {
        dp[points] = {
          robots: [...dp[points - robot.ratio].robots, robot],
          skillValue: newSkillValue,
        };
      }
    }
  }

  // 最適解を探す
  for (let points = targetPoints; points >= 1; points--) {
    if (dp[points].skillValue > bestCombination.totalSkillValue) {
      bestCombination = {
        robots: dp[points].robots,
        totalPoints: points,
        totalSkillValue: dp[points].skillValue,
      };
    }
  }

  return bestCombination;
}

// ツリー状のチーム編成パターンを生成（メイン機最優先）
export function generateTeamPatternTree(
  players: Player[],
  robots: Robot[],
  pointLimit: number,
  lockedRobots?: Record<string, string>
): Array<{
  playerName: string;
  pointUsage: number;
  robots: RobotWithSkill[];
  alternatives?: Array<{
    playerName: string;
    pointUsage: number;
    robots: RobotWithSkill[];
  }>;
}> {
  const patterns: Array<{
    playerName: string;
    pointUsage: number;
    robots: RobotWithSkill[];
    alternatives?: Array<{
      playerName: string;
      pointUsage: number;
      robots: RobotWithSkill[];
    }>;
  }> = [];

  players.forEach((player) => {
    const playerLockedRobot = lockedRobots?.[player.name];

    const playerRobots = robots
      .map((robot) => {
        const skill = player.skills[robot.name] || "使えない";
        const skillValue = SKILL_LEVELS[skill].value;

        return {
          ...robot,
          skillValue,
          playerName: player.name,
          skillLevel: skill,
        };
      })
      .filter((robot) => {
        // 使えない機体を除外
        if (robot.skillValue <= 0) return false;

        // 固定機体がある場合、それ以外は除外
        if (playerLockedRobot) {
          return robot.name === playerLockedRobot;
        }

        // 他のプレイヤーに固定されている機体は除外
        if (lockedRobots) {
          const isLockedByOther = Object.entries(lockedRobots).some(
            ([otherPlayer, robotName]) =>
              otherPlayer !== player.name && robotName === robot.name
          );
          if (isLockedByOther) return false;
        }

        return true;
      });

    // メイン機を最優先でソート
    const sortedRobots = playerRobots.sort((a, b) => {
      // 1. メイン機を最優先
      if (a.skillLevel === "メイン機" && b.skillLevel !== "メイン機") return -1;
      if (b.skillLevel === "メイン機" && a.skillLevel !== "メイン機") return 1;

      // 2. 同じスキルレベルの場合はレシオが低い（使いやすい）順
      if (a.skillLevel === b.skillLevel) {
        return a.ratio - b.ratio;
      }

      // 3. スキルレベル順（メイン機 > サブ機 > 一応乗れる > 自信なし）
      const skillOrder: Record<SkillLevel, number> = {
        メイン機: 0,
        サブ機: 1,
        一応乗れる: 2,
        自信なし: 3,
        使えない: 4,
      };
      return skillOrder[a.skillLevel] - skillOrder[b.skillLevel];
    });

    const playerPatterns: Array<{
      pointUsage: number;
      robots: RobotWithSkill[];
      mainRobotCount: number;
      efficiency: number;
    }> = [];

    // 1〜6PTまでの組み合わせを計算（メイン機優先）
    for (let points = 1; points <= Math.min(pointLimit, 6); points++) {
      const combination = findBestMainRobotCombination(sortedRobots, points);

      if (combination.robots.length > 0) {
        const mainRobotCount = combination.robots.filter(
          (r) => r.skillLevel === "メイン機"
        ).length;
        const efficiency =
          combination.totalSkillValue / combination.totalPoints;

        playerPatterns.push({
          pointUsage: combination.totalPoints,
          robots: combination.robots,
          mainRobotCount,
          efficiency,
        });
      }
    }

    // メイン機数 → 効率 の順でソート
    const sortedPatterns = playerPatterns.sort((a, b) => {
      if (a.mainRobotCount !== b.mainRobotCount) {
        return b.mainRobotCount - a.mainRobotCount; // メイン機数が多い順
      }
      return b.efficiency - a.efficiency; // 効率が良い順
    });

    if (sortedPatterns.length > 0) {
      const mainPattern = sortedPatterns[0];

      // 代替パターン：メイン機数や効率が違うパターン
      const alternatives = sortedPatterns
        .slice(1)
        .filter(
          (pattern) =>
            pattern.pointUsage !== mainPattern.pointUsage ||
            pattern.mainRobotCount !== mainPattern.mainRobotCount
        )
        .slice(0, 2);

      patterns.push({
        playerName: player.name,
        pointUsage: mainPattern.pointUsage,
        robots: mainPattern.robots,
        alternatives: alternatives.map((alt) => ({
          playerName: player.name,
          pointUsage: alt.pointUsage,
          robots: alt.robots,
        })),
      });
    }
  });

  return patterns;
}

// メイン機を優先した組み合わせ探索
function findBestMainRobotCombination(
  robots: RobotWithSkill[],
  targetPoints: number
): {
  robots: RobotWithSkill[];
  totalPoints: number;
  totalSkillValue: number;
} {
  let bestCombination = {
    robots: [] as RobotWithSkill[],
    totalPoints: 0,
    totalSkillValue: 0,
  };

  // メイン機から優先的に選択する貪欲法
  const selectedRobots: RobotWithSkill[] = [];
  let currentPoints = 0;
  let currentSkillValue = 0;

  for (const robot of robots) {
    if (currentPoints + robot.ratio <= targetPoints) {
      selectedRobots.push(robot);
      currentPoints += robot.ratio;
      currentSkillValue += robot.skillValue;

      // 目標ポイントに達したら終了
      if (currentPoints === targetPoints) break;
    }
  }

  if (selectedRobots.length > 0) {
    bestCombination = {
      robots: selectedRobots,
      totalPoints: currentPoints,
      totalSkillValue: currentSkillValue,
    };
  }

  return bestCombination;
}

// チーム全体の最適化パターンを生成
export function generateOptimizationPatterns(
  players: Player[],
  robots: Robot[],
  pointLimit: number
): {
  standard: OptimizationResult[];
  priorityPatterns: PriorityOptimizationResult[];
} {
  // 標準最適化
  const standard = calculateAllOptimalCombinations(players, robots, pointLimit);

  // 各プレイヤーを優先するパターン
  const priorityPatterns = players.map((player) =>
    calculatePriorityOptimization(players, robots, pointLimit, player)
  );

  return {
    standard,
    priorityPatterns,
  };
}

// プレイヤー優先のチーム編成パターンを生成
// バランス重視のチーム編成パターンを生成（メイン・サブ機優先）
export function generateBalancedPatterns(
  players: Player[],
  robots: Robot[],
  pointLimit: number,
  lockedRobots?: Record<string, string>
): Array<{
  playerName: string;
  pointUsage: number;
  robots: RobotWithSkill[];
  alternatives?: Array<{
    playerName: string;
    pointUsage: number;
    robots: RobotWithSkill[];
  }>;
}> {
  // より多くの人がメイン・サブ機に乗れるパターンを生成
  const patterns: Array<{
    playerName: string;
    pointUsage: number;
    robots: RobotWithSkill[];
    alternatives?: Array<{
      playerName: string;
      pointUsage: number;
      robots: RobotWithSkill[];
    }>;
  }> = [];

  // 各プレイヤーのメイン・サブ機をリストアップ
  const playerMainSubRobots: Record<string, RobotWithSkill[]> = {};

  players.forEach((player) => {
    const mainSubRobots = robots
      .map((robot) => {
        const skill = player.skills[robot.name] || "使えない";
        const skillValue = SKILL_LEVELS[skill].value;

        return {
          ...robot,
          skillValue,
          playerName: player.name,
          skillLevel: skill,
        };
      })
      .filter((robot) => {
        // メイン機・サブ機・一応乗れるまで含める（より多様なパターン生成のため）
        if (
          robot.skillLevel !== "メイン機" &&
          robot.skillLevel !== "サブ機" &&
          robot.skillLevel !== "一応乗れる"
        )
          return false;

        // 他のプレイヤーに固定されている機体は除外
        if (lockedRobots) {
          const isLockedByOther = Object.entries(lockedRobots).some(
            ([otherPlayer, robotName]) =>
              otherPlayer !== player.name && robotName === robot.name
          );
          if (isLockedByOther) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // メイン機を最優先
        if (a.skillLevel === "メイン機" && b.skillLevel !== "メイン機")
          return -1;
        if (b.skillLevel === "メイン機" && a.skillLevel !== "メイン機")
          return 1;

        // サブ機を次に優先
        if (a.skillLevel === "サブ機" && b.skillLevel === "一応乗れる")
          return -1;
        if (b.skillLevel === "サブ機" && a.skillLevel === "一応乗れる")
          return 1;

        // 同じスキルレベルの場合はレシオが低い順
        return a.ratio - b.ratio;
      });

    playerMainSubRobots[player.name] = mainSubRobots;
  });

  // メイン・サブ機を多く含む組み合わせを優先的に生成
  const maxPatterns = 50; // 候補数を大幅増加
  const usedCombinations = new Set<string>();

  for (
    let attempt = 0;
    attempt < 300 && patterns.length < maxPatterns; // 試行回数も増加
    attempt++
  ) {
    const combination = generateBalancedCombination(
      players,
      playerMainSubRobots,
      pointLimit,
      lockedRobots
    );

    if (combination && combination.length > 0) {
      // 組み合わせをソートして一意性をチェック
      const sortedCombination = [...combination].sort((a, b) =>
        a.playerName.localeCompare(b.playerName)
      );
      const combinationKey = sortedCombination
        .map((c) => `${c.playerName}:${c.robots[0]?.name}`)
        .join("|");

      if (!usedCombinations.has(combinationKey)) {
        usedCombinations.add(combinationKey);
        // 完全なチーム編成のみを追加（全プレイヤーが機体を持つ）
        if (combination.length === players.length) {
          patterns.push(...combination);
        }
      }
    }
  }

  return patterns.slice(0, maxPatterns);
}

// バランス重視の組み合わせを生成
function generateBalancedCombination(
  players: Player[],
  playerMainSubRobots: Record<string, RobotWithSkill[]>,
  pointLimit: number,
  lockedRobots?: Record<string, string>
): Array<{
  playerName: string;
  pointUsage: number;
  robots: RobotWithSkill[];
}> | null {
  const assignment: Array<{
    playerName: string;
    pointUsage: number;
    robots: RobotWithSkill[];
  }> = [];

  const usedRobots = new Set<string>();
  let remainingPoints = pointLimit;

  // ランダムにプレイヤーの順序を決定
  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

  for (const player of shuffledPlayers) {
    const playerLockedRobot = lockedRobots?.[player.name];

    let selectedRobot: RobotWithSkill | null = null;

    if (playerLockedRobot) {
      // 固定機体がある場合
      const lockedRobotData = playerMainSubRobots[player.name]?.find(
        (r) => r.name === playerLockedRobot
      );
      if (lockedRobotData && lockedRobotData.ratio <= remainingPoints) {
        selectedRobot = lockedRobotData;
      }
    } else {
      // メイン・サブ機から選択
      const availableRobots =
        playerMainSubRobots[player.name]?.filter(
          (robot) =>
            !usedRobots.has(robot.name) && robot.ratio <= remainingPoints
        ) || [];

      if (availableRobots.length > 0) {
        // ランダム性を追加してより多様なパターンを生成
        // 上位候補からランダムに選択（メイン機優先は維持）
        const topCandidates = availableRobots.slice(
          0,
          Math.min(3, availableRobots.length)
        );
        const randomIndex = Math.floor(Math.random() * topCandidates.length);
        selectedRobot = topCandidates[randomIndex];
      }
    }

    if (selectedRobot) {
      assignment.push({
        playerName: player.name,
        pointUsage: selectedRobot.ratio,
        robots: [selectedRobot],
      });
      usedRobots.add(selectedRobot.name);
      remainingPoints -= selectedRobot.ratio;
    } else {
      // 固定機体がある場合、または適切な機体がない場合は失敗
      return null;
    }
  }

  return assignment;
}

export function generatePlayerPriorityPatterns(
  players: Player[],
  robots: Robot[],
  pointLimit: number,
  priorityPlayerId: number,
  lockedRobots?: Record<string, string>
): Array<{
  playerName: string;
  pointUsage: number;
  robots: RobotWithSkill[];
  alternatives?: Array<{
    playerName: string;
    pointUsage: number;
    robots: RobotWithSkill[];
  }>;
}> {
  const priorityPlayer = players.find((p) => p.id === priorityPlayerId);
  if (!priorityPlayer) return [];

  // 優先プレイヤーの使用可能機体を取得
  const priorityPlayerRobots = robots
    .map((robot) => {
      const skill = priorityPlayer.skills[robot.name] || "使えない";
      const skillValue = SKILL_LEVELS[skill].value;

      return {
        ...robot,
        skillValue,
        playerName: priorityPlayer.name,
        skillLevel: skill,
      };
    })
    .filter((robot) => {
      // 一応乗れる以上のスキルレベルを含める
      if (robot.skillLevel === "自信なし" || robot.skillLevel === "使えない")
        return false;

      // 他のプレイヤーに固定されている機体は除外
      if (lockedRobots) {
        const isLockedByOther = Object.entries(lockedRobots).some(
          ([otherPlayer, robotName]) =>
            otherPlayer !== priorityPlayer.name && robotName === robot.name
        );
        if (isLockedByOther) return false;
      }

      return true;
    })
    .sort((a, b) => {
      // メイン機を最優先
      if (a.skillLevel === "メイン機" && b.skillLevel !== "メイン機") return -1;
      if (b.skillLevel === "メイン機" && a.skillLevel !== "メイン機") return 1;

      // スキル値/レシオ比で効率順
      return b.skillValue / b.ratio - a.skillValue / a.ratio;
    });

  const patterns: Array<{
    playerName: string;
    pointUsage: number;
    robots: RobotWithSkill[];
    alternatives?: Array<{
      playerName: string;
      pointUsage: number;
      robots: RobotWithSkill[];
    }>;
  }> = [];

  // 優先プレイヤーに固定機体がある場合は、それのみを使用
  const priorityPlayerLockedRobot = lockedRobots?.[priorityPlayer.name];
  let robotsToProcess: RobotWithSkill[] = [];

  if (priorityPlayerLockedRobot) {
    // 固定機体がある場合は、その機体のみを使用
    const lockedRobotData = priorityPlayerRobots.find(
      (r) => r.name === priorityPlayerLockedRobot
    );
    if (lockedRobotData) {
      robotsToProcess = [lockedRobotData];
    }
  } else {
    // 固定機体がない場合は通常通り最大30パターン
    robotsToProcess = priorityPlayerRobots.slice(0, 30);
  }

  // 優先プレイヤーの機体を使ったパターンを生成
  for (let i = 0; i < robotsToProcess.length; i++) {
    const robot = robotsToProcess[i];
    const remainingPoints = pointLimit - robot.ratio;

    if (remainingPoints < 0) continue;

    // 他のプレイヤーの最適組み合わせを計算
    const otherPlayers = players.filter((p) => p.id !== priorityPlayerId);
    const alternatives: Array<{
      playerName: string;
      pointUsage: number;
      robots: RobotWithSkill[];
    }> = [];

    // 簡単な貪欲法で他プレイヤーの機体を割り当て
    const usedRobots = new Set([robot.name]);
    let currentRemainingPoints = remainingPoints;

    otherPlayers.forEach((player) => {
      const playerBestRobot = robots
        .filter((r) => !usedRobots.has(r.name))
        .map((r) => {
          const skill = player.skills[r.name] || "使えない";
          const skillValue = SKILL_LEVELS[skill].value;

          return {
            ...r,
            skillValue,
            playerName: player.name,
            skillLevel: skill,
          };
        })
        .filter((r) => {
          // 一応乗れる以上のスキルレベルを含める
          if (r.skillLevel === "自信なし" || r.skillLevel === "使えない")
            return false;
          if (r.ratio > currentRemainingPoints) return false;

          // 固定機体チェック
          const playerLockedRobot = lockedRobots?.[player.name];
          if (playerLockedRobot && r.name !== playerLockedRobot) {
            return false;
          }

          return true;
        })
        .sort((a, b) => b.skillValue / b.ratio - a.skillValue / a.ratio)[0];

      if (playerBestRobot) {
        alternatives.push({
          playerName: player.name,
          pointUsage: playerBestRobot.ratio,
          robots: [playerBestRobot],
        });
        usedRobots.add(playerBestRobot.name);
        currentRemainingPoints -= playerBestRobot.ratio;
      }
    });

    patterns.push({
      playerName: priorityPlayer.name,
      pointUsage: robot.ratio,
      robots: [robot],
      alternatives,
    });
  }

  return patterns;
}
