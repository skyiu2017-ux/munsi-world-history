import React, { useState, useEffect, useRef } from 'react';
import { Question, UserProfile } from '../types/history';
import { storageService } from '../services/storageService';
import { PixelExplorer } from './PixelExplorer';
import confetti from 'canvas-confetti';
import { Flame, Timer, Trophy, RotateCcw, Zap, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { shuffleQuestionsAndOptions } from '../utils/quizUtils';

interface SpeedChallengeProps {
  questions: Question[];
  userProfile: UserProfile;
  onFinish: (result: {
    score: number;
    maxCombo: number;
    accuracy: number;
    timeTakenSeconds: number;
    speedPerQuestion: number;
    escapeFloor: string;
  }) => void;
  onExit: () => void;
}

export const SpeedChallenge: React.FC<SpeedChallengeProps> = ({
  questions,
  userProfile,
  onFinish,
  onExit
}) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'ended'>('ready');
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [score, setScore] = useState<number>(0);
  const [hearts, setHearts] = useState<number>(3);
  const answerLock = useRef(false);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [totalAnswered, setTotalAnswered] = useState<number>(0);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [shuffledList, setShuffledList] = useState<Question[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Distance to dungeon exit (starts at 100m, each correct moves 8m closer!)
  const [distanceToExit, setDistanceToExit] = useState<number>(100);

  // Time tracking
  const [startTime, setStartTime] = useState<number>(0);
  const [finalTimeSeconds, setFinalTimeSeconds] = useState<number>(60);

  const timerRef = useRef<any>(null);

  const startChallenge = () => {
    const pool = shuffleQuestionsAndOptions(questions);
    setShuffledList(pool);
    setCurrentQIndex(0);
    setTimeLeft(60);
    setScore(0);
    setHearts(3);
    answerLock.current = false;
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setTotalAnswered(0);
    setDistanceToExit(100);
    setFeedback(null);
    setStartTime(Date.now());
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          const elapsed = (Date.now() - startTime) / 1000;
          setFinalTimeSeconds(Math.min(60, Number(elapsed.toFixed(1))));
          endChallenge();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [gameState, startTime]);

  const endChallenge = () => {
    setGameState('ended');
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const handleSelect = (selectedIdx: number) => {
    if (gameState !== 'playing' || answerLock.current) return;
    answerLock.current = true;
    const currentQ = shuffledList[currentQIndex];
    if (!currentQ) return;

    setTotalAnswered(prev => prev + 1);
    const isCorrect = selectedIdx === currentQ.correctIndex;

    if (isCorrect) {
      setFeedback('correct');
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);
      const nextCorrect = correctCount + 1;
      setCorrectCount(nextCorrect);

      // Advance towards dungeon exit (8m per correct answer)
      const newDistance = Math.max(0, distanceToExit - 8);
      setDistanceToExit(newDistance);

      // Score bonus with combo
      const comboMultiplier = nextCombo >= 5 ? 2.5 : nextCombo >= 3 ? 1.8 : 1.2;
      const points = Math.round(150 * comboMultiplier);
      setScore(prev => prev + points);

      // Add 2 bonus seconds if combo >= 3
      if (nextCombo >= 3) {
        setTimeLeft(prev => Math.min(90, prev + 2));
      }

      if (nextCombo % 4 === 0) {
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.7 }
        });
      }

      // If reached exit door!
      if (newDistance === 0) {
        clearInterval(timerRef.current);
        const elapsed = (Date.now() - startTime) / 1000;
        setFinalTimeSeconds(Number(elapsed.toFixed(1)));
        setTimeout(() => {
          endChallenge();
        }, 500);
        return;
      }
    } else {
      setFeedback('wrong');
      setCombo(0);
      storageService.addWrongNote(currentQ, selectedIdx);
      const remaining = Math.max(0, hearts - 1);
      setHearts(remaining);
      if (remaining === 0) {
        clearInterval(timerRef.current);
        setFinalTimeSeconds(Math.min(60, Number(((Date.now() - startTime) / 1000).toFixed(1))));
        setTimeout(() => endChallenge(), 350);
        return;
      }
    }

    // Move to next question after short visual confirmation
    setTimeout(() => {
      setFeedback(null);
      answerLock.current = false;
      if (currentQIndex + 1 < shuffledList.length) {
        setCurrentQIndex(prev => prev + 1);
      } else {
        const reshuffled = shuffleQuestionsAndOptions(questions);
        setShuffledList(reshuffled);
        setCurrentQIndex(0);
      }
    }, 280);
  };

  const currentQ = shuffledList[currentQIndex];
  const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
  const speedPerQuestion = totalAnswered > 0 
    ? Number((finalTimeSeconds / totalAnswered).toFixed(1)) 
    : 0;
  const isEscaped = distanceToExit <= 0;
  const escapeFloor = isEscaped 
    ? '지상 탈출 성공! 🏆' 
    : distanceToExit <= 25 
    ? 'B1층 (출구 바로 앞)' 
    : distanceToExit <= 50 
    ? 'B3층 (지하 통로)' 
    : 'B7층 (깊은 미궁)';

  if (gameState === 'ready') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-6">
        {/* Pixel Explorer Character Visual */}
        <div className="flex justify-center py-2">
          <PixelExplorer size="xl" state="sweating_running" showSweat={true} />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 font-pixel text-xs font-bold">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>60초 스피드 던전 탈출기</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
            땀을 흘리며 던전을 질주하라!
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-w-lg mx-auto">
            어두운 지하 미궁에 갇힌 탐험가가 탈출구(100m)를 향해 전력 질주합니다!<br />
            문제를 신속하고 정확하게 풀수록 출구로 빠르게 다가가며, 콤보 달성 시 보너스 시간(+2초)을 획득합니다.
          </p>
        </div>

        {/* Game Rules Card */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-stone-900 border border-amber-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 text-left space-y-2 max-w-lg mx-auto font-pixel">
          <div className="font-bold text-amber-900 dark:text-amber-400 flex items-center gap-1.5">
            <span>⚔️ 던전 탈출 규칙:</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-500 font-bold">1.</span>
            <span>정답을 맞힐 때마다 출구까지 8m씩 전력 질주합니다.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-500 font-bold">2.</span>
            <span>3연속 콤보 시 보너스 시간 +2초와 추가 점수 배율이 적용됩니다.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-500 font-bold">3.</span>
            <span>탈출에 걸린 시간(초)과 문제당 풀이 속도가 학급 순위에 영구 기록됩니다.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-500 font-bold">4.</span>
            <span>도전할 때마다 56개 전 단원 문제와 선지(1~4번)가 매번 완전히 다르게 랜덤 출제됩니다.</span>
          </div>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            onClick={onExit}
            className="px-5 py-2.5 text-xs font-semibold rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700"
          >
            돌아가기
          </button>
          <button
            onClick={startChallenge}
            className="px-7 py-3 text-sm font-extrabold rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all flex items-center gap-2 font-pixel"
          >
            <Flame className="w-4 h-4 fill-current" />
            <span>탈출 시작! (START 🏃‍♂️)</span>
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'ended') {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-6">
        <div className="flex justify-center py-2">
          <PixelExplorer size="xl" state={isEscaped ? 'escaped' : 'idle'} />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-pixel">
            {isEscaped ? '🎉 지상 탈출 성공!' : '⏱️ 타임오버! 탈출 종료'}
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {isEscaped 
              ? `놀라운 순발력! ${finalTimeSeconds}초 만에 던전을 완벽 탈출했습니다.`
              : `아쉽게도 시간이 종료되었습니다. 다음 번엔 더 빠르게 달려보세요!`}
          </p>
        </div>

        {/* Results Card with Speed Metrics */}
        <div className="p-6 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div className="space-y-1">
            <span className="text-xs text-stone-500 uppercase tracking-wider font-semibold font-pixel">
              최종 획득 점수
            </span>
            <div className="text-4xl font-black font-mono tabular-nums text-amber-700 dark:text-amber-400">
              {score.toLocaleString()} 점
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-stone-100 dark:border-stone-800 text-xs">
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60">
              <span className="text-stone-400 block mb-0.5">총 소요 시간</span>
              <span className="font-mono font-bold text-base text-stone-900 dark:text-stone-100">
                {finalTimeSeconds}초
              </span>
            </div>
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60">
              <span className="text-stone-400 block mb-0.5">문제당 속도</span>
              <span className="font-mono font-bold text-base text-amber-600 dark:text-amber-400">
                {speedPerQuestion}초/문항
              </span>
            </div>
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60">
              <span className="text-stone-400 block mb-0.5">최대 콤보</span>
              <span className="font-mono font-bold text-base text-orange-600">
                {maxCombo}회
              </span>
            </div>
            <div className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800/60">
              <span className="text-stone-400 block mb-0.5">정답률</span>
              <span className="font-mono font-bold text-base text-emerald-600">
                {accuracy}%
              </span>
            </div>
          </div>

          {/* Escape Status */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-stone-800 border border-amber-200 dark:border-stone-700 text-xs flex items-center justify-between font-pixel">
            <span className="text-stone-600 dark:text-stone-400">던전 도달 층수:</span>
            <span className="font-bold text-amber-800 dark:text-amber-400">{escapeFloor}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={startChallenge}
            className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-stone-200 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>다시 달리기</span>
          </button>
          <button
            onClick={() => onFinish({
              score,
              maxCombo,
              accuracy,
              timeTakenSeconds: finalTimeSeconds,
              speedPerQuestion,
              escapeFloor
            })}
            className="px-6 py-2.5 text-xs font-bold rounded-xl bg-amber-700 hover:bg-amber-800 text-white shadow-xs transition-colors flex items-center gap-2 font-pixel"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>랭킹 기록 등록</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
      {/* HUD Header */}
      <div className="bg-stone-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-md border-2 border-stone-800 font-pixel">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 text-white font-mono font-bold text-base tabular-nums animate-pulse">
            <Timer className="w-4 h-4" />
            <span>{timeLeft}s</span>
          </div>
          {combo > 1 && (
            <div className="text-xs font-bold text-amber-400 flex items-center gap-1 animate-bounce">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>{combo} COMBO!</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] text-stone-400 block">SCORE</span>
            <span className="font-mono font-bold text-xl text-amber-400 tabular-nums">
              {score}
            </span>
          </div>
          <button
            onClick={endChallenge}
            className="text-xs text-stone-400 hover:text-white px-2 py-1"
          >
            종료
          </button>
        </div>
      </div>

      {/* Real-time Dungeon Running Track with Pixel Explorer Sweating 💦 */}
      <div className="relative h-28 bg-stone-950 rounded-2xl border-2 border-stone-800 overflow-hidden shadow-inner flex flex-col justify-between p-3 select-none">
        {/* Stone Dungeon Background Wall with Torches */}
        <div className="flex justify-between items-center px-4">
          <div className="flex items-center gap-1 text-[11px] text-amber-400 font-pixel">
            <span className="animate-torch">🔥</span>
            <span>지하 미궁 탈출로</span>
          </div>
          <div className="text-xs font-pixel text-stone-400">
            남은 거리: <span className="font-bold text-amber-300">{distanceToExit}m</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-amber-400 font-pixel">
            <span>출구 게이트</span>
            <span className="text-sm">🚪</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 py-1" aria-label={`남은 하트 ${hearts}개`}>
          {[0,1,2].map(i => <span key={i} className={`text-2xl ${i < hearts ? 'opacity-100' : 'opacity-25 grayscale'}`} aria-hidden="true">❤️</span>)}
          {hearts <= 2 && <span className="text-xs text-rose-300 font-bold">{hearts === 1 ? '위험! 마지막 하트' : '조심! 캐릭터가 떨고 있어요'}</span>}
        </div>
        {/* Runner Stage & Animated Floor */}
        <div className="relative h-14 flex items-end">
          {/* Moving Stone Floor */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-stone-800 border-t-2 border-amber-900/60 animate-floor" />

          {/* Running Pixel Explorer with flying sweat droplets */}
          <div 
            className="absolute transition-all duration-300 ease-out"
            style={{
              left: `calc(${Math.min(82, Math.max(10, ((100 - distanceToExit) / 100) * 82))}% - 24px)`,
              bottom: '2px'
            }}
          >
            <div className="flex flex-col items-center">
              <PixelExplorer size="lg" state={hearts <= 2 ? "trembling" : "sweating_running"} showSweat={hearts <= 2} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Question Card: ALL 4 options ALWAYS displayed completely */}
      {currentQ && (
        <div className={`bg-white dark:bg-stone-900 rounded-2xl border-2 transition-all p-6 sm:p-8 space-y-6 shadow-sm ${
          feedback === 'correct'
            ? 'border-emerald-500 ring-2 ring-emerald-500/20'
            : feedback === 'wrong'
            ? 'border-rose-500 ring-2 ring-rose-500/20'
            : 'border-stone-200 dark:border-stone-800'
        }`}>
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span className="font-bold text-amber-700 dark:text-amber-400">
              {currentQ.chapterTitle}
            </span>
            <span className="px-2 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 text-[11px]">
              난이도: {currentQ.difficulty}
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 leading-snug">
            {currentQ.question}
          </h3>

          {currentQ.passage && (
            <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-stone-800 text-xs sm:text-sm text-stone-700 dark:text-stone-300 font-serif leading-relaxed border border-stone-200 dark:border-stone-700 whitespace-pre-line">
              {currentQ.passage}
            </div>
          )}

          {/* 4 Choices: ALWAYS rendered completely with full text */}
          <div className="space-y-3 pt-2">
            {currentQ.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                className="w-full p-4 rounded-xl text-left text-xs sm:text-sm font-medium bg-stone-50 dark:bg-stone-800 hover:bg-amber-100/70 dark:hover:bg-amber-950/50 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 transition-all flex items-start gap-3 active:scale-[0.99] shadow-xs"
              >
                <span className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 font-pixel">
                  {idx + 1}
                </span>
                <span className="flex-1 break-keep leading-relaxed whitespace-normal font-sans text-stone-900 dark:text-stone-100">
                  {opt}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
