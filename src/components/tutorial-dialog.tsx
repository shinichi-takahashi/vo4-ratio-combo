"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  Settings,
  Target,
  Trophy,
  Medal,
  ThumbsUp,
  X,
  Lock,
  Share2,
  Rocket,
  Zap,
  Flame,
} from "lucide-react";

interface TutorialStep {
  title: string;
  content: React.ReactNode;
  icon: React.ReactNode;
}

export function TutorialDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const tutorialSteps: TutorialStep[] = [
    {
      title: "VO4レシオバトル チーム編成ツールへようこそ！",
      icon: <Rocket className="w-6 h-6 text-blue-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            このツールは、VO4（アーマード・コア）のレシオバトルで最適なチーム編成を自動計算するアプリです！
          </p>
          <div className="bg-blue-50 p-3 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">✨ 主な機能</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• プレイヤーごとのスキルレベル設定</li>
              <li>• ポイント制限内での最適編成計算</li>
              <li>• 機体固定による編成パターン生成</li>
              <li>• URLでの設定共有</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: "Step 1: プレイヤー管理",
      icon: <Users className="w-6 h-6 text-green-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            まず、チームメンバーを追加しましょう！
          </p>
          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">
              👥 プレイヤー追加方法
            </h4>
            <ol className="text-sm text-green-700 space-y-1">
              <li>1. 「新しいプレイヤー名」に名前を入力</li>
              <li>2. 「プレイヤー追加」ボタンをクリック</li>
              <li>3. 不要な場合は❌ボタンで削除可能</li>
            </ol>
          </div>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="text-xs text-yellow-700">
              💡 URLから設定を読み込んだ場合、既にプレイヤーが追加されています
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Step 2: スキルレベル設定",
      icon: <Target className="w-6 h-6 text-purple-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            各プレイヤーの機体ごとのスキルレベルを設定します。
          </p>
          <div className="bg-purple-50 p-3 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-3">
              🎯 スキルレベル一覧
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium">メイン機</span>
                <span className="text-xs text-gray-600">- 最も得意な機体</span>
              </div>
              <div className="flex items-center gap-2">
                <Medal className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium">サブ機</span>
                <span className="text-xs text-gray-600">- よく使える機体</span>
              </div>
              <div className="flex items-center gap-2">
                <ThumbsUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">一応乗れる</span>
                <span className="text-xs text-gray-600">- 使える機体</span>
              </div>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium">自信なし</span>
                <span className="text-xs text-gray-600">
                  - あまり得意じゃない
                </span>
              </div>
              <div className="flex items-center gap-2">
                <X className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium">使えない</span>
                <span className="text-xs text-gray-600">- 使用不可</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Step 3: ポイント制限設定",
      icon: <Settings className="w-6 h-6 text-indigo-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            チーム全体のポイント上限を設定します。
          </p>
          <div className="bg-indigo-50 p-3 rounded-lg">
            <h4 className="font-semibold text-indigo-800 mb-2">
              ⚙️ ポイント制限
            </h4>
            <ul className="text-sm text-indigo-700 space-y-1">
              <li>• デフォルト: 9PT</li>
              <li>• 大会ルールに合わせて調整可能</li>
              <li>• 入力欄で自由に変更できます</li>
            </ul>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-2">
              🎮 レシオについて
            </h4>
            <p className="text-sm text-gray-600">
              各機体には「レシオ」（ポイント）が設定されており、強い機体ほど高いレシオが設定されています。
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Step 4: 最適化計算",
      icon: <Zap className="w-6 h-6 text-yellow-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            設定が完了したら、最適な編成を計算しましょう！
          </p>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">⚡ 計算実行</h4>
            <ol className="text-sm text-yellow-700 space-y-1">
              <li>1. 「最適化計算」ボタンをクリック</li>
              <li>2. パターンタイプを選択：</li>
              <li className="ml-4">• バランス: 全体最適</li>
              <li className="ml-4">• プレイヤー優先: 特定プレイヤー重視</li>
              <li>3. 結果が「チーム編成パターン表」に表示</li>
            </ol>
          </div>
        </div>
      ),
    },
    {
      title: "Step 5: 機体固定機能",
      icon: <Lock className="w-6 h-6 text-red-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            特定のプレイヤーの機体を固定して、他のメンバーの最適編成を計算できます。
          </p>
          <div className="bg-red-50 p-3 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">
              🔒 固定機能の使い方
            </h4>
            <ol className="text-sm text-red-700 space-y-1">
              <li>1. チーム編成パターン表の「機体固定設定」で選択</li>
              <li>2. プレイヤーごとに固定したい機体を選択</li>
              <li>3. 「固定しない」で解除可能</li>
              <li>4. 固定された機体は🔒アイコンで表示</li>
            </ol>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-700">
              💡 固定機体が設定されると、自動で再計算されます
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Step 6: 結果の見方",
      icon: <Flame className="w-6 h-6 text-orange-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">計算結果の見方を説明します。</p>
          <div className="bg-orange-50 p-3 rounded-lg">
            <h4 className="font-semibold text-orange-800 mb-2">📊 表示順序</h4>
            <div className="flex items-center gap-1 mb-2">
              <Trophy className="w-3 h-3 text-yellow-600" />
              <Badge className="bg-red-500 text-white text-xs">3PT</Badge>
              <span className="text-sm">バル・ミ・ランダ</span>
            </div>
            <p className="text-xs text-orange-700">
              アイコン → ポイント → 機体名 の順で表示されます
            </p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">
              🏆 パターンの優先順位
            </h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• メイン機・サブ機の数が多い順</li>
              <li>• 効率（スキル値/ポイント）が高い順</li>
              <li>• 上位15パターンまで表示</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: "Step 7: 設定の共有",
      icon: <Share2 className="w-6 h-6 text-cyan-600" />,
      content: (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            設定をURLで共有して、チームメンバーと編成を検討できます。
          </p>
          <div className="bg-cyan-50 p-3 rounded-lg">
            <h4 className="font-semibold text-cyan-800 mb-2">🔗 URL共有機能</h4>
            <ol className="text-sm text-cyan-700 space-y-1">
              <li>1. 「共有URL生成」ボタンをクリック</li>
              <li>2. 設定が含まれたURLが生成されます</li>
              <li>3. 「URLをコピー」でクリップボードにコピー</li>
              <li>4. チームメンバーに共有してください</li>
            </ol>
          </div>
          <div className="bg-purple-50 p-3 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">💾 自動保存</h4>
            <p className="text-sm text-purple-700">
              設定変更時に自動でURLが更新され、ブラウザの戻る/進むボタンでも設定が保持されます。
            </p>
          </div>
        </div>
      ),
    },
  ];

  const nextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, tutorialSteps.length - 1));
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const resetAndClose = () => {
    setCurrentStep(0);
    setIsOpen(false);
  };

  const currentTutorial = tutorialSteps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="w-4 h-4" />
          使い方
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {currentTutorial.icon}
            <div>
              <DialogTitle className="text-lg">
                {currentTutorial.title}
              </DialogTitle>
              <DialogDescription>
                Step {currentStep + 1} of {tutorialSteps.length}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">{currentTutorial.content}</div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentStep + 1) / tutorialSteps.length) * 100}%`,
            }}
          />
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            前へ
          </Button>

          <div className="flex gap-1">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep
                    ? "bg-blue-500"
                    : index < currentStep
                    ? "bg-blue-300"
                    : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          {currentStep === tutorialSteps.length - 1 ? (
            <Button onClick={resetAndClose} className="gap-2">
              完了
              <Trophy className="w-4 h-4" />
            </Button>
          ) : (
            <Button onClick={nextStep} className="gap-2">
              次へ
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
