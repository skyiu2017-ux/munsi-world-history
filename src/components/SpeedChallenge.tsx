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
    correctCount: number;
    totalAnswered: number;
  }) => void;
  onExit: () => void;
}

// 푸른 괴물의 거대한 팔과 손: 실제 진행 시간에 맞춰 탐험가의 뒤를 추격합니다.
const BlueMonsterArm: React.FC<{ caught?: boolean }> = ({ caught = false }) => (
  <svg viewBox="0 0 180 130" className={`w-[132px] h-[106px] sm:w-[164px] sm:h-[128px] drop-shadow-[0_0_13px_rgba(37,99,235,0.65)] ${caught ? 'animate-pulse' : ''}`} aria-hidden="true">
    <path d="M-12 84 C29 90 53 81 82 72 L113 59 L140 20 Q147 10 154 17 Q159 22 153 34 L143 59 L161 40 Q173 30 177 40 Q182 49 169 60 L155 77 L173 74 Q184 73 182 84 Q180 95 164 94 L146 94 Q149 105 139 112 Q130 119 120 108 L108 92 L82 103 Q43 121 -14 111 Z" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="5" strokeLinejoin="round"/>
    <path d="M19 94 Q62 93 92 84 L117 81 M108 92 L123 96" fill="none" stroke="#0b1f69" strokeWidth="6" strokeLinecap="round"/>
    <path d="M150 23 L143 40 M171 46 L160 58 M176 83 L162 83" stroke="#dbeafe" strokeWidth="4" strokeLinecap="round"/>
  </svg>
);

export const SpeedChallenge: React.FC<SpeedChallengeProps> = ({
  questions,
  userProfile,
  onFinish,
  onExit
}) => {
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'ended'>('ready');
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [score, setScore] = useState<number>(0);
  const [hearts, setHearts] = useState<number>(5);
  const [wrongStreak, setWrongStreak] = useState<number>(0);
  const [failReason, setFailReason] = useState<string | null>(null);
  const answerLock = useRef(false);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [totalAnswered, setTotalAnswered] = useState<number>(0);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [shuffledList, setShuffledList] = useState<Question[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // 60초 생존형 게임: 출구 거리가 아닌 정답 횟수와 괴물과의 거리를 추적합니다.

  // Time tracking
  const [startTime, setStartTime] = useState<number>(0);
  const [finalTimeSeconds, setFinalTimeSeconds] = useState<number>(60);

  const timerRef = useRef<any>(null);
  const lastAnswerAt = useRef<number>(0);
  const startedAt = useRef<number>(0);
  const endedRef = useRef(false);
  const [idleSeconds, setIdleSeconds] = useState(0);

  const startChallenge = () => {
    const pool = shuffleQuestionsAndOptions(questions);
    setShuffledList(pool);
    setCurrentQIndex(0);
    setTimeLeft(60);
    setScore(0);
    setHearts(5);
    setWrongStreak(0);
    setFailReason(null);
    answerLock.current = false;
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setTotalAnswered(0);
    startedAt.current = Date.now();
    lastAnswerAt.current = startedAt.current;
    endedRef.current = false;
    setIdleSeconds(0);
    setFeedback(null);
    setStartTime(Date.now());
    setGameState('playing');
  };

  useEffect(() => {
    if (gameState !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [gameState, startTime]);

  const endChallenge = () => {
    if (endedRef.current) return;
    endedRef.current = true;
    clearInterval(timerRef.current);
    setFailReason('도전을 종료하여 괴물에게 붙잡혔습니다.');
    setFinalTimeSeconds(Math.min(60, Number(((Date.now() - startedAt.current) / 1000).toFixed(1))));
    setGameState('ended');
  };

  // 상태 업데이트 함수 안에서 다른 상태를 바꾸지 않고 시간 종료를 처리합니다.
  useEffect(() => {
    if (gameState !== 'playing' || timeLeft !== 0 || endedRef.current) return;
    endedRef.current = true;
    clearInterval(timerRef.current);
    setFinalTimeSeconds(60);
    setScore(prev => prev + 1200); // 60초 생존 보너스
    setGameState('ended');
    confetti({ particleCount: 120, spread: 85, origin: { y: 0.6 } });
  }, [gameState, timeLeft]);

  // 20초 무응답 실패: 마지막 선택 이후 20초가 지났는지 0.2초 간격으로 확인합니다.
  // 정답이든 오답이든 실제로 선택했을 때만 추격 유예 시간이 초기화됩니다.
  useEffect(() => {
    if (gameState !== 'playing') return;
    const check = setInterval(() => {
      const elapsed = Date.now() - lastAnswerAt.current;
      setIdleSeconds(Math.min(20, Math.floor(elapsed / 1000)));
      if (elapsed >= 20000 && !endedRef.current) {
        endedRef.current = true;
        clearInterval(timerRef.current);
        setFailReason('20초 동안 답을 선택하지 않아 푸른 괴물에게 붙잡혔습니다.');
        setFinalTimeSeconds(Math.min(60, Number(((Date.now() - startedAt.current) / 1000).toFixed(1))));
        setGameState('ended');
      }
    }, 200);
    return () => clearInterval(check);
  }, [gameState]);

  const handleSelect = (selectedIdx: number) => {
    if (gameState !== 'playing' || answerLock.current || endedRef.current || timeLeft <= 0) return;
    answerLock.current = true;
    lastAnswerAt.current = Date.now();
    setIdleSeconds(0);
    const currentQ = shuffledList[currentQIndex];
    if (!currentQ) return;

    setTotalAnswered(prev => prev + 1);
    const isCorrect = selectedIdx === currentQ.correctIndex;

    if (isCorrect) {
      setFeedback('correct');
      setWrongStreak(0);
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);
      const nextCorrect = correctCount + 1;
      setCorrectCount(nextCorrect);

      // Score bonus with combo
      const comboMultiplier = nextCombo >= 5 ? 2.5 : nextCombo >= 3 ? 1.8 : 1.2;
      const points = Math.round(150 * comboMultiplier);
      setScore(prev => prev + points);

      // 60초 제한은 보너스로 연장하지 않습니다. 콤보는 점수만 높입니다.

      if (nextCombo % 4 === 0) {
        confetti({
          particleCount: 30,
          spread: 60,
          origin: { y: 0.7 }
        });
      }

    } else {
      setFeedback('wrong');
      setCombo(0);
      storageService.addWrongNote(currentQ, selectedIdx);
      const remaining = Math.max(0, hearts - 1);
      const nextStreak = wrongStreak + 1;
      setWrongStreak(nextStreak);
      setHearts(remaining);
      if (remaining === 0 || nextStreak >= 3) {
        setFailReason(remaining === 0 ? '누적 오답 5회: 에너지 소진' : '연속 오답 3회: 도전 실패');
        clearInterval(timerRef.current);
        setFinalTimeSeconds(Math.min(60, Number(((Date.now() - startTime) / 1000).toFixed(1))));
        setTimeout(() => endChallenge(), 350);
        return;
      }
    }

    // Move to next question after short visual confirmation
    setTimeout(() => {
      if (endedRef.current) return;
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
  // 생존 여부는 정답 수가 아닌 60초를 끝까지 버텼는지로만 결정합니다.
  const isSurvived = gameState === 'ended' && timeLeft === 0 && !failReason;
  const wrongCount = 5 - hearts;
  const danger = Math.max(0, Math.min(1, (60 - timeLeft) / 60));
  // 정답을 맞힐 때마다 탐험가가 조금 더 앞서 나갑니다. 화면을 벗어나지는 않습니다.
  const heroPosition = 45 + Math.min(12, correctCount * 1.35);
  // 4회 누적 오답 / 2회 연속 오답 때 괴물 손끝이 캐릭터 바로 뒤에 붙습니다.
  // 그 이전에는 시간과 무응답이 쌓일수록 서서히 가까워지고, 정답은 간격을 벌립니다.
  const nearCatch = hearts <= 1 || wrongStreak >= 2 || idleSeconds >= 18;
  const monsterGap = nearCatch
    ? 116
    : Math.max(140, 245 - wrongCount * 23 - wrongStreak * 14
       - danger * 22 - idleSeconds * 2.5 + Math.min(correctCount, 12) * 3);
  const monsterScale = nearCatch ? 1.13 : 0.72 + (245 - monsterGap) / 320;
  const escapeFloor = isSurvived
    ? '60초 생존 성공! 🏆'
    : `괴물에게 잡힘 · 정답 ${correctCount}개`;

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
            60초 동안 푸른 괴물에게 잡히지 않고 최대한 많은 역사 문제를 푸세요!<br />
            정답을 맞힐수록 앞서 달리고, 오답이나 망설임이 쌓이면 괴물이 따라붙습니다.
          </p>
        </div>

        {/* Game Rules Card */}
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-stone-900 border border-amber-200 dark:border-stone-800 text-xs text-stone-700 dark:text-stone-300 text-left space-y-2 max-w-lg mx-auto font-pixel">
          <div className="font-bold text-amber-900 dark:text-amber-400 flex items-center gap-1.5">
            <span>⚔️ 60초 생존 도전 규칙:</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-500 font-bold">1.</span>
            <span>정답을 맞힐수록 탐험가가 괴물보다 앞서 달립니다. 문제 수에 제한 없이 계속 도전하세요.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-500 font-bold">2.</span>
            <span>60초를 끝까지 버티면 생존 성공! 정답 점수에 생존 보너스 1,200점이 더해집니다.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-500 font-bold">3.</span>
            <span>20초 무응답이면 잡힙니다. 누적 오답 4회 또는 연속 2회면 손이 코앞까지 다가옵니다.</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-orange-500 font-bold">4.</span>
            <span>누적 오답 5회 또는 연속 오답 3회면 즉시 붙잡힙니다. 정확하게 많이 풀수록 점수가 높아집니다.</span>
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
            <span>60초 생존 시작!</span>
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'ended') {
    return (
      <div className="max-w-xl mx-auto px-4 py-12 text-center space-y-6">
        <div className="flex justify-center items-center py-2 min-h-28">
          {!isSurvived && <div className="w-24 sm:w-28 -mr-5 opacity-90"><BlueMonsterArm caught /></div>}
          <PixelExplorer size="xl" state={isSurvived ? 'escaped' : 'trembling'} showSweat={!isSurvived} />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100 font-pixel">
            {isSurvived ? '🎉 60초 생존 성공! 괴물을 따돌렸습니다!' : '푸른 괴물에게 붙잡혔습니다 · GAME OVER'}
          </h2>
          <p className="text-sm text-stone-600 dark:text-stone-400">
            {isSurvived
              ? `60초 동안 정답 ${correctCount}개! 생존 보너스 1,200점을 획득했습니다.`
              : failReason || '괴물에게 붙잡혔습니다. 다시 도전해 보세요.'}
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

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-stone-100 dark:border-stone-800 text-xs">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30">
                <span className="text-stone-500 block mb-0.5">맞힌 문제</span>
                <span className="font-mono font-bold text-base text-emerald-700 dark:text-emerald-400">{correctCount}개</span>
              </div>
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
            <span className="text-stone-600 dark:text-stone-400">생존 결과:</span>
            <span className="font-bold text-amber-800 dark:text-amber-400">{escapeFloor}</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
          <button onClick={onExit} className="px-5 py-2.5 text-xs font-semibold rounded-xl border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200">첫 화면으로</button>
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
              escapeFloor,
              correctCount,
              totalAnswered
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
      <div className="relative h-52 sm:h-56 bg-stone-950 rounded-2xl border-2 border-stone-800 overflow-hidden shadow-inner flex flex-col justify-between p-3 select-none">
        {/* Stone Dungeon Background Wall with Torches */}
        <div className="flex justify-between items-center px-4">
          <div className="flex items-center gap-1 text-[11px] text-amber-400 font-pixel">
            <span className="animate-torch">🔥</span>
            <span>60초 생존의 미궁</span>
          </div>
          <div className="text-xs font-pixel text-stone-400">
            정답: <span className="font-bold text-amber-300">{correctCount}개</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-amber-400 font-pixel">
            <span>60초 버티기</span>
            <span className="text-sm">⏳</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 py-1" aria-label={`남은 에너지 ${hearts}/5, 연속 오답 ${wrongStreak}/3`}>
          <div className="flex gap-1">{[0,1,2,3,4].map(i => <span key={i} className={`text-xl ${i < hearts ? 'opacity-100' : 'opacity-25 grayscale'}`} aria-hidden="true">❤️</span>)}</div>
          <span className="text-[11px] text-rose-300 font-bold">에너지 {hearts}/5 · 연속 오답 {wrongStreak}/3</span>
        </div>
        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-200">
          <span className={nearCatch ? 'text-rose-400 font-black animate-pulse' : ''}>{nearCatch ? '위험! 괴물이 바로 뒤에!' : '정답을 맞혀 괴물과 거리를 벌리세요'}</span>
          <span className={idleSeconds >= 15 ? 'text-rose-400 animate-pulse font-black' : 'text-amber-300'}>무응답 {idleSeconds}/20초</span>
          <div className="h-1.5 w-16 rounded-full bg-stone-700 overflow-hidden"><div className="h-full bg-blue-400 transition-all duration-200" style={{ width: `${Math.min(100, idleSeconds * 5)}%` }} /></div>
        </div>
        {/* Runner Stage & Animated Floor */}
        <div className="relative h-36 sm:h-40 flex items-end overflow-hidden">
          {/* Moving Stone Floor */}
          <div className="absolute bottom-0 left-0 right-0 h-4 bg-stone-800 border-t-2 border-amber-900/60 animate-floor" />

          {/* 손끝의 위치는 캐릭터와의 간격을 기준으로 계산: 모바일에서도 근접 연출 보장 */}
          <div className="absolute bottom-2 z-10 pointer-events-none transition-[left,transform] duration-500 ease-out"
            style={{
              left: `calc(${heroPosition}% - ${monsterGap}px)`,
              transform: `scale(${monsterScale})`,
              transformOrigin: 'left bottom',
              opacity: 0.97
            }}>
            <BlueMonsterArm />
          </div>
          {/* Running Pixel Explorer with flying sweat droplets */}
          <div 
            className="absolute transition-all duration-300 ease-out z-20"
            style={{
              left: `${heroPosition}%`,
              bottom: '2px'
            }}
          >
            <div className="flex flex-col items-center">
              <PixelExplorer size="lg" state={nearCatch ? "trembling" : "sweating_running"} showSweat={nearCatch} />
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
