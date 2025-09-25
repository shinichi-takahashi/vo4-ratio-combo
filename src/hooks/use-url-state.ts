"use client";

import { useState, useEffect, useCallback } from "react";
import { Player } from "@/types";
import { updateUrlWithPlayers, loadPlayersFromUrl } from "@/lib/url-state";

export function useUrlState() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // 初期ロード
  useEffect(() => {
    const loadedPlayers = loadPlayersFromUrl();
    if (loadedPlayers.length > 0) {
      setPlayers(loadedPlayers);
    }
    setIsLoaded(true);
  }, []);

  // プレイヤーデータが変更された時のURL更新（初期ロード後のみ）
  useEffect(() => {
    if (isLoaded && players.length > 0) {
      updateUrlWithPlayers(players);
    }
  }, [players, isLoaded]);

  // プレイヤーデータを更新（URL更新は useEffect で処理）
  const updatePlayers = useCallback((newPlayers: Player[]) => {
    setPlayers(newPlayers);
  }, []);

  // プレイヤーを追加
  const addPlayer = useCallback((name: string) => {
    setPlayers((prev) => {
      const newPlayer: Player = {
        id: Date.now(),
        name,
        skills: {}, // 後で全機体分を設定
      };
      return [...prev, newPlayer];
    });
  }, []);

  // プレイヤーを削除
  const removePlayer = useCallback((playerId: number) => {
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
  }, []);

  // プレイヤーのスキルを更新
  const updatePlayerSkill = useCallback(
    (playerId: number, robotName: string, skill: any) => {
      setPlayers((prev) =>
        prev.map((player) => {
          if (player.id === playerId) {
            return {
              ...player,
              skills: {
                ...player.skills,
                [robotName]: skill,
              },
            };
          }
          return player;
        })
      );
    },
    []
  );

  return {
    players,
    isLoaded,
    updatePlayers,
    addPlayer,
    removePlayer,
    updatePlayerSkill,
  };
}
