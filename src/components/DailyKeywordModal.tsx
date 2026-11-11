import React, { useState, useEffect } from 'react';
import { DailyKeywordQuiz } from '../data/dailyKeywordsData';
import { shuffleQuestionOptions } from '../utils/quizUtils';
import confetti from 'canvas-confetti';
import { 
  Sparkles, CheckCircle2, XCircle, Lightbulb, 
  Calendar, Flame, ArrowRight, X, BookOpen, Award
} from 'lucide-react';

interface DailyKeywordModalProps {
  quiz: DailyKeywordQuiz;
  isOpen: boolean;
  onClose: (dontShowToday?: boolean) => void;
  onRewardXP: (xpAmount: number) => void;
}

export const DailyKeywordModal: React.FC<DailyKeywordModalProps> = ({
  quiz,
  isOpen,
  onClose,
  onRewardXP
}) => {
  const [randomizedQuiz, setRandomizedQuiz] = useState<DailyKeywordQuiz>(() => shuffleQuestionOptions(quiz));
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [dontShowToday, setDontShowToday] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && quiz) {
      setRandomizedQuiz(shuffleQuestionOptions(quiz));
      setSelectedOption(null);
      setIsAnswered(false);
    }
  }, [isOpen, quiz]);

  const todayStr = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    if (idx === randomizedQuiz.correctIndex) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });
      onRewardXP(50);
    }
  };

  const handleFinish = () => {
    onClose(dontShowToday);
  };

  const isCorrect = selectedOption === randomizedQuiz.correctIndex;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-amber-700 via-amber-600 to-orange-600 text-white p-5 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-100">
              <Calendar className="w-3.5 h-3.5" />
              <span>{todayStr}</span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1 text-amber-200">
                <Flame className="w-3 h-3 text-orange-300" /> 매일 1문항 데일리 챌린지
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white">
              오늘의 역사 키워드 퀴즈
            </h2>
            <div className="text-xs text-amber-100 font-medium pt-0.5">
              키워드: <span className="bg-white/20 px-2 py-0.5 rounded font-bold">{quiz.keyword}</span>
            </div>
          </div>

          <button
            onClick={() => onClose(dontShowToday)}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Era & Hint Banner */}
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl border border-stone-100 dark:border-stone-800">
            <div>
              <span className="font-semibold text-stone-800 dark:text-stone-200">{quiz.chapterTitle}</span>
              <span className="mx-1">/</span>
              <span>{quiz.era}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold text-[11px]">
              <Sparkles className="w-3.5 h-3.5" /> +50 XP
            </div>
          </div>

          {/* Question Text */}
          <div className="space-y-2">
            <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 leading-snug">
              {quiz.question}
            </h3>
            <p className="text-xs text-amber-800 dark:text-amber-400 font-medium flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5" />
              <span>힌트: {quiz.hint}</span>
            </p>
          </div>

          {/* Options: Always randomly distributed 1~4 or 1~5 */}
          <div className="space-y-2.5">
            {randomizedQuiz.options.map((option, idx) => {
              let btnStyle = 'bg-stone-50 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-900 dark:text-stone-100';

              if (isAnswered) {
                if (idx === randomizedQuiz.correctIndex) {
                  btnStyle = 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 font-bold text-emerald-950 dark:text-emerald-200 shadow-xs';
                } else if (idx === selectedOption) {
                  btnStyle = 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-950 dark:text-rose-200';
                } else {
                  btnStyle = 'opacity-40 bg-stone-50 border-stone-200 dark:border-stone-800 text-stone-400';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => handleSelect(idx)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-bold flex items-center justify-center shrink-0 font-pixel">
                      {idx + 1}
                    </span>
                    <span>{option}</span>
                  </div>

                  {isAnswered && idx === randomizedQuiz.correctIndex && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  {isAnswered && idx === selectedOption && idx !== randomizedQuiz.correctIndex && (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation and Fun Fact after answering */}
          {isAnswered && (
            <div className="space-y-3 pt-2 animate-fadeIn">
              {/* Feedback Alert */}
              <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                isCorrect
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-200'
              }`}>
                <div className="font-bold mb-1 flex items-center gap-1.5">
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>정답입니다! 오늘 출석 보너스 +50 XP 획득!</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-rose-600" />
                      <span>아쉽습니다! 정답은 [{quiz.options[quiz.correctIndex]}]입니다.</span>
                    </>
                  )}
                </div>
                <div>{quiz.explanation}</div>
              </div>

              {/* Historical Fun Fact */}
              <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-stone-800/80 border border-amber-200/60 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300 space-y-1">
                <div className="font-bold text-amber-900 dark:text-amber-400 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>오늘의 역사 한 줄 상식</span>
                </div>
                <p className="leading-relaxed">{quiz.funFact}</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer with "Don't show today" option and confirmation */}
        <div className="p-4 bg-stone-50 dark:bg-stone-800/50 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={dontShowToday}
              onChange={e => setDontShowToday(e.target.checked)}
              className="rounded border-stone-300 text-amber-600 focus:ring-amber-500"
            />
            <span>오늘 하루 동안 이 팝업 열지 않기</span>
          </label>

          <button
            onClick={handleFinish}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 hover:bg-stone-800 transition-colors"
          >
            {isAnswered ? '학습 시작하기' : '다음에 풀기'}
          </button>
        </div>
      </div>
    </div>
  );
};
