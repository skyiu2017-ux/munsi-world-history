import React, { useState, useEffect, useRef } from 'react';
import { Question, Difficulty, QuizSessionConfig, UserProfile } from '../types/history';
import { storageService } from '../services/storageService';
import confetti from 'canvas-confetti';
import { 
  Sparkles, Zap, Award, Flame, Timer, CheckCircle, 
  XCircle, Lightbulb, HelpCircle, ArrowRight, RotateCcw, 
  TrendingUp, Trophy, ChevronRight, BookOpen, Heart, ShieldAlert
} from 'lucide-react';

import { DungeonProgressBar, PixelExplorer } from './PixelExplorer';
import { shuffleArray, shuffleQuestionOptions, shuffleQuestionOptionsBalanced } from '../utils/quizUtils';

interface QuizEngineProps {
  questions: Question[];
  config: QuizSessionConfig;
  userProfile: UserProfile;
  onFinishQuiz: (result: {
    score: number;
    accuracy: number;
    maxCombo: number;
    totalAnswered: number;
    correctCount: number;
    timeTakenSeconds: number;
    speedPerQuestion: number;
    escapeFloor: string;
  }) => void;
  onExit: () => void;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({
  questions,
  config,
  userProfile,
  onFinishQuiz,
  onExit
}) => {
  // Level-up quiz automatically adjusts question difficulty
  const [currentDifficulty, setCurrentDifficulty] = useState<Difficulty>(
    config.initialDifficulty || '초급'
  );

  // Filtered pool & question tracking
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [activeQuestionList, setActiveQuestionList] = useState<Question[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  
  // Scoring & Stats
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [totalAnswered, setTotalAnswered] = useState<number>(0);
  
  // Lifelines
  const [hiddenOptions, setHiddenOptions] = useState<number[]>([]);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [lifeline5050Used, setLifeline5050Used] = useState<boolean>(false);
  const HINT_LIMIT = 2;
  const [hintsUsed, setHintsUsed] = useState<number>(0);
  // 적응형 모드: 누적 5회 또는 연속 3회 오답(시간 초과 포함) 시 도전 종료
  const [wrongCount, setWrongCount] = useState<number>(0);
  const [wrongStreak, setWrongStreak] = useState<number>(0);
  const [failureReason, setFailureReason] = useState<string | null>(null);

  // Adaptive Notice
  const [difficultyChangeNotice, setDifficultyChangeNotice] = useState<string | null>(null);

  // Timer per question (15s standard)
  const [timeLeft, setTimeLeft] = useState<number>(35);
  const timerRef = useRef<any>(null);

  // Session startTime
  const [startTime, setStartTime] = useState<number>(Date.now());

  // Session initialize
  useEffect(() => {
    let pool = [...questions];
    if (config.chapterId) {
      pool = pool.filter(q => q.chapterId === config.chapterId);
    }
    if (config.mode === 'chapter' && config.initialDifficulty) {
      pool = pool.filter(q => q.difficulty === config.initialDifficulty);
    }

    // Shuffle pool & randomize options for every question (1~4, 1~5)
    const shuffled = shuffleArray(pool);
    const targetLength = config.mode === 'adaptive' ? 20 : (config.questionCount || Math.min(8, shuffled.length));
    // 적응형 첫 문제는 반드시 초급으로 시작하고, 이후 실력에 따라 난이도를 조정한다.
    const firstEasy = config.mode === 'adaptive' ? shuffled.find(q => q.difficulty === '초급') : undefined;
    const orderedPool = firstEasy ? [firstEasy, ...shuffled.filter(q => q.id !== firstEasy.id)] : shuffled;
    const finalizedQuestions = shuffleQuestionOptionsBalanced(orderedPool.slice(0, targetLength));
    setActiveQuestionList(finalizedQuestions);
    setCurrentIndex(0);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setCorrectCount(0);
    setTotalAnswered(0);
    setIsAnswered(false);
    setSelectedOption(null);
    setHiddenOptions([]);
    setShowHint(false);
    setHintsUsed(0);
    setLifeline5050Used(false);
    setWrongCount(0);
    setWrongStreak(0);
    setFailureReason(null);
    setCurrentDifficulty(config.initialDifficulty || '초급');
    setStartTime(Date.now());
  }, [config, questions]);

  const currentQ = activeQuestionList[currentIndex];

  // Timer countdown
  useEffect(() => {
    if (!currentQ || isAnswered) return;

    // 단원 학습과 레벨업 퀴즈에 읽고 판단할 시간을 제공합니다.
    setTimeLeft(config.mode === 'chapter' ? (config.initialDifficulty === '고급' ? 45 : 35) : 35);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentIndex, isAnswered, currentQ]);

  const handleTimeOut = () => {
    if (isAnswered || failureReason) return;
    setIsAnswered(true);
    setCombo(0);
    setTotalAnswered(prev => prev + 1);
    if (currentQ) storageService.addWrongNote(currentQ, -1);
    registerWrongAnswer();
  };

  const registerWrongAnswer = () => {
    if (config.mode !== 'adaptive') return;
    const nextWrong = wrongCount + 1;
    const nextStreak = wrongStreak + 1;
    setWrongCount(nextWrong);
    setWrongStreak(nextStreak);
    if (nextWrong >= 5) {
      setFailureReason('누적 오답 5회로 에너지가 모두 소진되었습니다.');
    } else if (nextStreak >= 3) {
      setFailureReason('3문제를 연속으로 틀려 도전이 종료되었습니다.');
    }
  };

  const getDifficultyMultiplier = (diff: Difficulty) => {
    switch (diff) {
      case '초급': return 1.0;
      case '중급': return 1.5;
      case '고급': return 2.2;
    }
  };

  const getComboMultiplier = (c: number) => {
    if (c >= 7) return 2.5;
    if (c >= 5) return 2.0;
    if (c >= 3) return 1.5;
    if (c >= 2) return 1.2;
    return 1.0;
  };

  const handleSelectOption = (idx: number) => {
    if (isAnswered || !currentQ || failureReason) return;
    clearInterval(timerRef.current);

    setSelectedOption(idx);
    setIsAnswered(true);
    setTotalAnswered(prev => prev + 1);

    const isCorrect = idx === currentQ.correctIndex;

    if (isCorrect) {
      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > maxCombo) setMaxCombo(nextCombo);
      setCorrectCount(prev => prev + 1);
      setWrongStreak(0);

      // Score calculation
      const basePoints = 100;
      const speedBonus = Math.floor(timeLeft * 3.5);
      const diffMul = getDifficultyMultiplier(currentQ.difficulty);
      const comboMul = getComboMultiplier(nextCombo);
      const gained = Math.round((basePoints + speedBonus) * diffMul * comboMul);
      setScore(prev => prev + gained);

      // Confetti for combo milestones
      if (nextCombo >= 3) {
        confetti({
          particleCount: 35,
          spread: 60,
          origin: { y: 0.7 }
        });
      }

      // Adaptive difficulty logic:
      if (config.mode === 'adaptive') {
        if (nextCombo >= 2 && currentDifficulty === '초급') {
          setCurrentDifficulty('중급');
          setDifficultyChangeNotice('실력 향상 감지! 난이도가 [중급]으로 승급되었습니다. (배율 1.5x)');
          // Swap next questions to medium
          adaptUpcomingQuestions('중급');
        } else if (nextCombo >= 4 && currentDifficulty === '중급') {
          setCurrentDifficulty('고급');
          setDifficultyChangeNotice('최상위 실력 달성! 최고 난이도 [고급] 문제에 도전합니다. (배율 2.2x)');
          adaptUpcomingQuestions('고급');
        }
      }
    } else {
      setCombo(0);
      // Auto add to wrong notes
      storageService.addWrongNote(currentQ, idx);
      registerWrongAnswer();

      // Adaptive downshift if struggling
      if (config.mode === 'adaptive' && currentDifficulty !== '초급') {
        setCurrentDifficulty('초급');
        setDifficultyChangeNotice('기초 개념 다지기! 난이도를 [초급]으로 조정하여 핵심을 복습합니다.');
        adaptUpcomingQuestions('초급');
      }
    }
  };

  const adaptUpcomingQuestions = (targetDiff: Difficulty) => {
    setActiveQuestionList(prevList => {
      const nextRemaining = prevList.slice(currentIndex + 1);
      // Look in pool for questions matching targetDiff
      const pool = questions.filter(
        q => q.difficulty === targetDiff && !prevList.some(p => p.id === q.id)
      );
      if (pool.length === 0) return prevList;

      const available = shuffleArray(pool);
      const updatedRemaining = nextRemaining.map((q, i) => {
        // 대체할 새 문항이 없으면 원래 문제를 유지합니다. 같은 회차 중복 출제 금지.
        const replacement = available[i] || q;
        return replacement === q ? q : shuffleQuestionOptions(replacement, q.correctIndex);
      });
      return [...prevList.slice(0, currentIndex + 1), ...updatedRemaining];
    });
  };

  const use5050Lifeline = () => {
    if (lifeline5050Used || isAnswered || !currentQ) return;
    setLifeline5050Used(true);

    const wrongIndexes = currentQ.options
      .map((_, i) => i)
      .filter(i => i !== currentQ.correctIndex);
    
    // Pick two wrong options to hide
    const toHide = wrongIndexes.sort(() => 0.5 - Math.random()).slice(0, 2);
    setHiddenOptions(toHide);
  };

  const useHintLifeline = () => {
    if (hintsUsed >= HINT_LIMIT || isAnswered || !currentQ || failureReason) return;
    setHintsUsed(prev => prev + 1);
    setShowHint(true);
  };

  // 레벨업 미궁: 20층에서 시작해 정답을 20개 맞히면 1층 출구에 도착합니다.
  // 오답은 층을 올리지 않습니다. 20문항을 다 풀고도 남은 층이 있으면
  // 다른 문제 20개를 추가하며, 기존 에너지와 누적 오답은 유지됩니다.
  const handleNextQuestion = () => {
    if (failureReason) return;
    setDifficultyChangeNotice(null);
    setHiddenOptions([]);
    setShowHint(false);
    setSelectedOption(null);
    setIsAnswered(false);

    const isLevelUp = config.mode === 'adaptive';
    const escaped = isLevelUp && correctCount >= 20;
    if (!escaped && currentIndex + 1 < activeQuestionList.length) {
      setCurrentIndex(prev => prev + 1);
      return;
    }

    if (isLevelUp && !escaped) {
      const used = new Set(activeQuestionList.map(q => q.id));
      const fresh = shuffleArray(questions.filter(q => !used.has(q.id))).slice(0, 20);
      if (fresh.length > 0) {
        setActiveQuestionList(prev => [...prev, ...shuffleQuestionOptionsBalanced(fresh)]);
        setCurrentIndex(prev => prev + 1);
        setDifficultyChangeNotice('남은 층에 도전! 다른 문제 20개로 계속 진행합니다. (에너지 유지)');
        return;
      }
    }

    const elapsed = Number(((Date.now() - startTime) / 1000).toFixed(1));
    const speedPerQuestion = totalAnswered > 0 ? Number((elapsed / totalAnswered).toFixed(1)) : 0;
    const escapeFloor = isLevelUp
      ? (escaped ? '1층 탈출 성공! 🏆' : '도전 실패 · 출제 가능한 문제 소진')
      : '단원 학습 완료';
    const accuracy = totalAnswered > 0 ? Math.round((correctCount / totalAnswered) * 100) : 0;
    if (escaped || !isLevelUp) {
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
    }
    onFinishQuiz({
      score, accuracy, maxCombo, totalAnswered, correctCount,
      timeTakenSeconds: elapsed, speedPerQuestion, escapeFloor
    });
  };

  if (!currentQ) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-4">
        <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          문제를 준비 중입니다...
        </h3>
        <button
          onClick={onExit}
          className="px-4 py-2 text-xs font-semibold rounded-lg bg-stone-900 text-white"
        >
          돌아가기
        </button>
      </div>
    );
  }

  const isCorrect = selectedOption === currentQ.correctIndex;
  const isAdaptive = config.mode === 'adaptive';
  const energy = Math.max(0, 5 - wrongCount);

  if (isAdaptive && failureReason) {
    return (
      <section className="max-w-2xl mx-auto px-4 py-10 space-y-5 text-center" role="status" aria-live="polite">
        <PixelExplorer size="xl" state="trembling" showSweat className="mx-auto" />
        <h2 className="text-2xl font-extrabold text-rose-700 dark:text-rose-300">도전 실패 · GAME OVER</h2>
        <p className="font-semibold text-stone-700 dark:text-stone-200">{failureReason}</p>
        <div className="flex justify-center gap-2" aria-label={`남은 에너지 ${energy}/5`}>
          {Array.from({ length: 5 }, (_, i) => (
            <Heart key={i} aria-hidden="true" className={`h-7 w-7 ${i < energy ? 'fill-rose-500 text-rose-500' : 'fill-stone-200 text-stone-400 dark:fill-stone-700'}`} />
          ))}
        </div>
        <div className="rounded-xl border border-stone-200 dark:border-stone-700 p-4 text-sm text-left space-y-2">
          <p>이번 도전: {totalAnswered}문항 응답 · {correctCount}문항 정답 · {score.toLocaleString()}점</p>
          <p><span className="font-bold">마지막 문제 해설:</span> {currentQ.explanation}</p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          <button onClick={onExit} className="px-5 py-2.5 rounded-xl border border-stone-300 dark:border-stone-700 text-sm font-bold">첫 화면으로</button>
          <button onClick={() => {
            const elapsed = Number(((Date.now() - startTime) / 1000).toFixed(1));
            onFinishQuiz({score, accuracy: totalAnswered ? Math.round(correctCount / totalAnswered * 100) : 0,
              maxCombo, totalAnswered, correctCount, timeTakenSeconds: elapsed,
              speedPerQuestion: totalAnswered ? Number((elapsed / totalAnswered).toFixed(1)) : 0,
              escapeFloor: '도전 실패'});
          }} className="px-5 py-2.5 rounded-xl bg-rose-700 text-white text-sm font-bold">결과 기록하고 종료</button>
        </div>
      </section>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top HUD Bar */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        {/* Progress & Chapter */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">
              문제 {currentIndex + 1} / {activeQuestionList.length}
            </span>
            <span className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate max-w-[200px]">
              {currentQ.chapterTitle}
            </span>
          </div>

          <span aria-hidden="true" className="text-stone-300 dark:text-stone-700">|</span>

          {/* Difficulty Badge */}
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <span className={`px-2 py-0.5 rounded text-[11px] ${
              currentQ.difficulty === '고급'
                ? 'bg-purple-100 text-purple-900 dark:bg-purple-950/60 dark:text-purple-300'
                : currentQ.difficulty === '중급'
                ? 'bg-blue-100 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300'
                : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}>
              {currentQ.difficulty}
            </span>
            {config.mode === 'adaptive' && (
              <span className="text-[11px] text-amber-700 dark:text-amber-400 flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> 적응형
              </span>
            )}
          </div>
        </div>

        {/* Combo & Score & Timer */}
        <div className="flex items-center gap-4">
          {/* Combo Streak */}
          {combo > 1 && (
            <div className="flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400 animate-bounce">
              <Flame className="w-4 h-4 fill-current" />
              <span>{combo} 연속 정답!</span>
              <span className="text-[10px] text-stone-500">({getComboMultiplier(combo)}x)</span>
            </div>
          )}

          {/* Current Score */}
          <div className="text-right">
            <span className="text-[10px] text-stone-500 block">점수</span>
            <span className="font-mono tabular-nums font-bold text-base text-amber-800 dark:text-amber-400">
              {score.toLocaleString()}
            </span>
          </div>

          {/* Timer Ring */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
            <Timer className={`w-4 h-4 ${timeLeft <= 5 ? 'text-rose-600 animate-pulse' : 'text-stone-500'}`} />
            <span className={`font-mono tabular-nums text-sm font-bold ${
              timeLeft <= 5 ? 'text-rose-600' : 'text-stone-900 dark:text-stone-100'
            }`}>
              {timeLeft}초
            </span>
          </div>

          {/* Quit button */}
          <button
            onClick={onExit}
            className="text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 px-2 py-1"
          >
            포기
          </button>
        </div>
      </div>

      {/* Adaptive Level Change Banner */}
      {difficultyChangeNotice && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-300 flex items-center gap-2.5 animate-fadeIn">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-medium">{difficultyChangeNotice}</span>
        </div>
      )}

      {/* 적응형 도전 에너지: 누적 5회 또는 연속 3회 오답 시 실패 */}
      {isAdaptive && (
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/70 bg-rose-50 dark:bg-rose-950/30 px-4 py-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2" role="status" aria-label={`에너지 ${energy}/5`}>
            <span className="text-xs font-extrabold text-rose-900 dark:text-rose-200">에너지</span>
            <div className="flex gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Heart key={i} aria-hidden="true" className={`h-6 w-6 sm:h-7 sm:w-7 ${i < energy ? 'fill-rose-500 text-rose-500' : 'fill-stone-200 text-stone-400 dark:fill-stone-700'}`} />
              ))}
            </div>
            <span className="text-xs font-mono font-bold text-rose-800 dark:text-rose-200">{energy}/5</span>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-800 dark:text-rose-200"><ShieldAlert className="h-4 w-4" /> 누적 오답 {wrongCount}/5 · 연속 오답 {wrongStreak}/3</span>
        </div>
      )}

      {/* Dungeon Escape Progress Bar */}
      <DungeonProgressBar
        currentFloor={correctCount}
        totalFloors={isAdaptive ? 20 : activeQuestionList.length}
        isEscaped={isAdaptive && correctCount >= 20}
        isInDanger={isAdaptive && energy <= 2}
      />

      {/* 도전당 50:50 찬스 1회 + 역사학자 힌트 2회. 사용 횟수는 다음 문항으로 넘어가도 유지. */}
      <div className="flex flex-wrap items-center gap-2 justify-end">
        <button
          onClick={use5050Lifeline}
          disabled={lifeline5050Used || isAnswered}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
            lifeline5050Used
              ? 'opacity-40 cursor-not-allowed bg-stone-100 border-stone-200 text-stone-400'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
          <span>50:50 ({lifeline5050Used ? 0 : 1}/1)</span>
        </button>

        <button
          onClick={useHintLifeline}
          disabled={hintsUsed >= HINT_LIMIT || isAnswered}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
            hintsUsed >= HINT_LIMIT
              ? 'opacity-40 cursor-not-allowed bg-stone-100 border-stone-200 text-stone-400'
              : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>역사학자 힌트 ({HINT_LIMIT - hintsUsed}/{HINT_LIMIT})</span>
        </button>
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Question Text */}
        <div className="space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 leading-snug">
            {currentQ.question}
          </h2>

          {/* Historical Passage / Source Box if exists */}
          {currentQ.passage && (
            <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 text-xs sm:text-sm text-stone-800 dark:text-stone-200 font-serif leading-relaxed whitespace-pre-line">
              {currentQ.passage}
            </div>
          )}

          {/* Hint Card when unlocked */}
          {showHint && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">힌트: </span>
                {currentQ.tip}
              </div>
            </div>
          )}
        </div>

        {/* Options: ALL 4 options ALWAYS displayed together */}
        <div className="space-y-3 pt-2">
          {currentQ.options.map((option, idx) => {
            const isEliminatedBy5050 = hiddenOptions.includes(idx);

            let optionStyle = 'bg-stone-50 dark:bg-stone-800/70 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200';

            if (isEliminatedBy5050) {
              optionStyle = 'opacity-25 line-through bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-400 cursor-not-allowed';
            } else if (isAnswered) {
              if (idx === currentQ.correctIndex) {
                optionStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold shadow-xs';
              } else if (idx === selectedOption) {
                optionStyle = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-900 dark:text-rose-200 font-semibold';
              } else {
                optionStyle = 'opacity-40 bg-stone-50 dark:bg-stone-800/40 border-stone-200 dark:border-stone-800 text-stone-400';
              }
            }

            return (
              <button
                key={idx}
                disabled={isAnswered || isEliminatedBy5050}
                onClick={() => handleSelectOption(idx)}
                className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-start justify-between gap-3 ${optionStyle}`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <span className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 font-pixel">
                    {idx + 1}
                  </span>
                  <span className="flex-1 break-keep leading-relaxed whitespace-normal text-stone-900 dark:text-stone-100">
                    {option}
                  </span>
                </div>

                {isAnswered && idx === currentQ.correctIndex && (
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                )}
                {isAnswered && idx === selectedOption && idx !== currentQ.correctIndex && (
                  <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>

        {/* Answer Explanation & Feedback Deck */}
        {isAnswered && (
          <div className="pt-6 border-t border-stone-200 dark:border-stone-800 space-y-4 animate-fadeIn">
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              isCorrect
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-200'
            }`}>
              {isCorrect ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="font-bold text-sm">
                  {isCorrect ? '정답입니다! 완벽한 이해도입니다.' : '아쉽습니다! 오답노트에 자동 등록되었습니다.'}
                </div>
                <div className="text-xs leading-relaxed text-stone-700 dark:text-stone-300">
                  {currentQ.explanation}
                </div>
              </div>
            </div>

            {/* Quick Memory Tip */}
            <div className="p-3 rounded-lg bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-300 flex items-center gap-2">
              <span className="font-bold shrink-0">시험 꿀팁:</span>
              <span>{currentQ.tip}</span>
            </div>

            {/* Next Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNextQuestion}
                className="px-6 py-2.5 text-xs font-bold rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white shadow-xs transition-colors flex items-center gap-2"
              >
                <span>{isAdaptive && correctCount >= 20 ? '1층 탈출 결과 보기' : currentIndex + 1 < activeQuestionList.length ? '다음 문제로' : isAdaptive ? '다음 20문항으로 계속 도전' : '결과 확인하기'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
