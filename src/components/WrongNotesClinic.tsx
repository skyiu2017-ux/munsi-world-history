import React, { useState } from 'react';
import { WrongNoteItem, Question } from '../types/history';
import { storageService } from '../services/storageService';
import { 
  CheckCircle2, XCircle, RotateCcw, Trash2, 
  Lightbulb, AlertCircle, Play, ChevronRight, BookOpen
} from 'lucide-react';
import { shuffleQuestionOptions } from '../utils/quizUtils';

interface WrongNotesClinicProps {
  wrongNotes: WrongNoteItem[];
  onRefreshNotes: () => void;
  onStartWrongQuiz: (questions: Question[]) => void;
}

export const WrongNotesClinic: React.FC<WrongNotesClinicProps> = ({
  wrongNotes,
  onRefreshNotes,
  onStartWrongQuiz
}) => {
  const [filterChapterId, setFilterChapterId] = useState<number | 'all'>('all');
  const [testingItem, setTestingItem] = useState<WrongNoteItem | null>(null);
  const [testSelected, setTestSelected] = useState<number | null>(null);
  const [testAnswered, setTestAnswered] = useState<boolean>(false);

  const filteredNotes = wrongNotes.filter(item => {
    if (filterChapterId !== 'all') {
      return item.question.chapterId === filterChapterId;
    }
    return true;
  });

  const handleMarkReviewed = (qId: string) => {
    storageService.markWrongNoteReviewed(qId);
    onRefreshNotes();
  };

  const handleClearReviewed = () => {
    storageService.clearReviewedWrongNotes();
    onRefreshNotes();
  };

  const handleStartRetest = (item: WrongNoteItem) => {
    setTestingItem({
      ...item,
      question: shuffleQuestionOptions(item.question)
    });
    setTestSelected(null);
    setTestAnswered(false);
  };

  const handleTestOptionClick = (idx: number) => {
    if (testAnswered || !testingItem) return;
    setTestSelected(idx);
    setTestAnswered(true);

    if (idx === testingItem.question.correctIndex) {
      storageService.markWrongNoteReviewed(testingItem.questionId);
      onRefreshNotes();
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-400 mb-1">
            <AlertCircle className="w-4 h-4" />
            <span>오답노트 & 약점 클리닉</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
            나만의 취약점 완전 정복
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            틀렸던 문제를 다시 분석하고 개념을 복습하면 시험에서 절대 틀리지 않습니다.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {wrongNotes.length > 0 && (
            <button
              onClick={() => onStartWrongQuiz(wrongNotes.map(n => n.question))}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors flex items-center gap-2"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>오답 전체 재도전 ({wrongNotes.length})</span>
            </button>
          )}

          {wrongNotes.some(n => n.reviewed) && (
            <button
              onClick={handleClearReviewed}
              className="px-3 py-2 text-xs font-medium rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-stone-400" />
              <span>완료 항목 정리</span>
            </button>
          )}
        </div>
      </div>

      {/* Interactive Single-Question Re-test Modal */}
      {testingItem && (
        <div className="p-6 rounded-2xl bg-amber-50/70 dark:bg-stone-800 border border-amber-300 dark:border-amber-800 shadow-sm space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
              [재도전] {testingItem.question.chapterTitle}
            </span>
            <button
              onClick={() => setTestingItem(null)}
              className="text-xs text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              닫기
            </button>
          </div>

          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            {testingItem.question.question}
          </h3>

          {testingItem.question.passage && (
            <div className="p-3 rounded-xl bg-white dark:bg-stone-900 text-xs font-serif leading-relaxed text-stone-800 dark:text-stone-200">
              {testingItem.question.passage}
            </div>
          )}

          <div className="space-y-2 pt-2">
            {testingItem.question.options.map((opt, idx) => {
              let btnStyle = 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700';

              if (testAnswered) {
                if (idx === testingItem.question.correctIndex) {
                  btnStyle = 'bg-emerald-100 border-emerald-500 font-bold text-emerald-950 dark:bg-emerald-950 dark:text-emerald-200';
                } else if (idx === testSelected) {
                  btnStyle = 'bg-rose-100 border-rose-500 text-rose-950 dark:bg-rose-950 dark:text-rose-200';
                }
              }

              return (
                <button
                  key={idx}
                  disabled={testAnswered}
                  onClick={() => handleTestOptionClick(idx)}
                  className={`w-full text-left p-3 text-xs rounded-xl border transition-all flex items-center justify-between ${btnStyle}`}
                >
                  <span>{idx + 1}. {opt}</span>
                  {testAnswered && idx === testingItem.question.correctIndex && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {testAnswered && (
            <div className="pt-3 border-t border-amber-200 dark:border-stone-700 flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-800 dark:text-stone-200">
                {testSelected === testingItem.question.correctIndex
                  ? '정답입니다! 복습 완료로 처리되었습니다.'
                  : '다시 한 번 오답 해설을 꼼꼼히 확인해보세요.'}
              </span>
              <button
                onClick={() => setTestingItem(null)}
                className="px-4 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-medium"
              >
                확인 완료
              </button>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {wrongNotes.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">
            현재 오답노트가 비어 있습니다!
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
            적응형 퀴즈나 스피드 챌린지를 풀다가 틀린 문제가 생기면 이곳에 자동으로 기록되어 집중 복습할 수 있습니다.
          </p>
        </div>
      ) : (
        /* Wrong Notes List */
        <div className="space-y-4">
          {/* Summary Stats Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-xs shadow-xs">
            <div>
              <span className="text-stone-400 block mb-0.5">등록된 오답</span>
              <span className="font-mono font-bold text-base text-stone-900 dark:text-stone-100">
                {wrongNotes.length}개
              </span>
            </div>
            <div>
              <span className="text-stone-400 block mb-0.5">복습 완료</span>
              <span className="font-mono font-bold text-base text-emerald-600 dark:text-emerald-400">
                {wrongNotes.filter(n => n.reviewed).length}개
              </span>
            </div>
            <div>
              <span className="text-stone-400 block mb-0.5">오답 정복률</span>
              <span className="font-mono font-bold text-base text-amber-700 dark:text-amber-400">
                {wrongNotes.length > 0
                  ? Math.round((wrongNotes.filter(n => n.reviewed).length / wrongNotes.length) * 100)
                  : 0}%
              </span>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <label htmlFor="chapter-select" className="text-xs font-semibold text-stone-600 dark:text-stone-400">
                단원별 필터:
              </label>
              <select
                id="chapter-select"
                value={filterChapterId}
                onChange={e => setFilterChapterId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">전체 단원 ({wrongNotes.length}개)</option>
                {Array.from(new Set(wrongNotes.map(n => n.question.chapterId))).map(cId => {
                  const title = wrongNotes.find(n => n.question.chapterId === cId)?.question.chapterTitle;
                  const count = wrongNotes.filter(n => n.question.chapterId === cId).length;
                  return (
                    <option key={cId} value={cId}>
                      {title} ({count}개)
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="text-xs text-stone-500 dark:text-stone-400">
              표시 중: {filteredNotes.length}개
            </div>
          </div>

          <div className="space-y-3">
            {filteredNotes.map(item => {
              const q = item.question;
              return (
                <div
                  key={item.questionId}
                  className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    item.reviewed
                      ? 'bg-stone-50/70 dark:bg-stone-900/40 border-stone-200 dark:border-stone-800 opacity-75'
                      : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-700 dark:text-amber-400">
                        {q.chapterTitle}
                      </span>
                      <span aria-hidden="true" className="text-stone-300">·</span>
                      <span className="text-stone-500">{q.difficulty}</span>
                      <span aria-hidden="true" className="text-stone-300">·</span>
                      <span className="text-stone-400 text-[11px]">{item.attemptDate}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.reviewed ? (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> 복습 완료
                        </span>
                      ) : (
                        <button
                          onClick={() => handleMarkReviewed(item.questionId)}
                          className="text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline"
                        >
                          복습 완료로 표시
                        </button>
                      )}

                      <button
                        onClick={() => handleStartRetest(item)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 hover:bg-amber-200 transition-colors flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>다시 풀기</span>
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {q.question}
                  </h4>

                  {q.passage && (
                    <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800 text-xs font-serif leading-relaxed text-stone-700 dark:text-stone-300">
                      {q.passage}
                    </div>
                  )}

                  {/* Correct vs Wrong Answer breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                      <span className="font-bold block mb-0.5">정답:</span>
                      <span>{q.correctIndex + 1}. {q.options[q.correctIndex]}</span>
                    </div>

                    {item.wrongAnswerIndex >= 0 && (
                      <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60">
                        <span className="font-bold block mb-0.5">내가 고른 오답:</span>
                        <span>{item.wrongAnswerIndex + 1}. {q.options[item.wrongAnswerIndex]}</span>
                      </div>
                    )}
                  </div>

                  {/* Explanation */}
                  <div className="text-xs text-stone-600 dark:text-stone-400 bg-stone-50 dark:bg-stone-800/50 p-3 rounded-lg leading-relaxed">
                    <span className="font-bold text-stone-800 dark:text-stone-200">해설: </span>
                    {q.explanation}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
