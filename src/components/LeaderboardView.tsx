import React, { useState } from 'react';
import { LeaderboardEntry, UserProfile } from '../types/history';
import { 
  Trophy, Users, Edit3, Flame, Clock, 
  Compass, DoorOpen, Award, CheckCircle2, ChevronRight, Sparkles, RefreshCw 
} from 'lucide-react';
import { PixelExplorer } from './PixelExplorer';
import { SCHOOL_NAME, CLASSES_LIST } from '../data/schoolConfig';

interface LeaderboardViewProps {
  entries: LeaderboardEntry[];
  userProfile: UserProfile;
  onUpdateProfile: (nickname: string, schoolName: string, gradeClass: string) => void;
  onStartChallenge: () => void;
  remoteEnabled: boolean;
  syncState: 'idle' | 'syncing' | 'error';
  onRefresh: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  entries,
  userProfile,
  onUpdateProfile,
  onStartChallenge,
  remoteEnabled,
  syncState,
  onRefresh
}) => {
  // Class selection: 'all' | 'tournament' | '3학년 1반' | '3학년 2반' | '3학년 3반' | '3학년 4반'
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [sortMetric, setSortMetric] = useState<'score' | 'speed' | 'combo'>('score');
  
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [editNick, setEditNick] = useState<string>(userProfile.nickname);
  const editSchool = SCHOOL_NAME;
  const [editClass, setEditClass] = useState<string>(userProfile.gradeClass || CLASSES_LIST[0]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(editNick, editSchool, editClass);
    setIsEditingProfile(false);
  };

  // Compute Class Tournament Stats (플레이 기록이 있는 학급만 순위에 포함)
  const classStats = CLASSES_LIST.map(cls => {
    const classMembers = entries.filter(e => e.gradeClass === cls);
    const count = classMembers.length;
    const totalScore = classMembers.reduce((sum, m) => sum + m.score, 0);
    const avgScore = count > 0 ? Math.round(totalScore / count) : 0;
    const escapes = classMembers.filter(m => (m.escapeRate ?? 0) >= 100 || m.escapeFloor?.includes('지상 탈출')).length;
    const bestStudent = [...classMembers].sort((a, b) => b.score - a.score)[0];
    const fastestStudent = classMembers
      .filter(m => m.timeTakenSeconds)
      .sort((a, b) => (a.timeTakenSeconds ?? 999) - (b.timeTakenSeconds ?? 999))[0];

    return {
      className: cls,
      count,
      totalScore,
      avgScore,
      escapes,
      bestStudent,
      fastestStudent
    };
  })
    .filter(c => c.count > 0)
    .sort((a, b) => b.avgScore - a.avgScore);

  // Filter list by selected class
  let displayedList = [...entries];
  if (selectedClass !== 'all' && selectedClass !== 'tournament') {
    displayedList = displayedList.filter(e => e.gradeClass === selectedClass);
  }

  // Sort by selected metric
  if (sortMetric === 'speed') {
    displayedList.sort((a, b) => {
      const aEscaped = (a.escapeRate ?? 0) >= 100;
      const bEscaped = (b.escapeRate ?? 0) >= 100;
      if (aEscaped && bEscaped) {
        return (a.timeTakenSeconds ?? 999) - (b.timeTakenSeconds ?? 999);
      }
      if (aEscaped !== bEscaped) {
        return aEscaped ? -1 : 1;
      }
      const rateDiff = (b.escapeRate ?? 0) - (a.escapeRate ?? 0);
      if (rateDiff !== 0) return rateDiff;
      return (a.timeTakenSeconds ?? 999) - (b.timeTakenSeconds ?? 999);
    });
  } else if (sortMetric === 'combo') {
    displayedList.sort((a, b) => b.maxCombo - a.maxCombo);
  } else {
    displayedList.sort((a, b) => b.score - a.score);
  }

  // Find user entry
  const myEntry = entries.find(e => e.isCurrentUser);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Retro Pixel Art Dungeon Leaderboard Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-stone-900 border-2 border-amber-800/80 p-6 text-stone-100 shadow-xl">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Animated Pixel Explorer with torch */}
            <div className="w-16 h-20 bg-stone-950/80 rounded-2xl border border-amber-700/60 flex items-center justify-center p-2 shrink-0 shadow-inner">
              <PixelExplorer state="cheering" showSweat={false} />
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-950/80 border border-amber-600/50 text-[11px] font-pixel text-amber-400">
                <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '6s' }} />
                <span>CLASS WORLD HISTORY BATTLE</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white font-display">
                각 학급별 세계사 랭킹 & 미궁 탈출전
              </h2>
              <p className="text-xs text-stone-400">
                우리 반 친구들과 순위를 겨루고, 다른 반과의 학급 대항전에서 1위를 차지해보세요!
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <button
            onClick={onStartChallenge}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-pixel text-xs tracking-wider font-bold shadow-lg hover:shadow-amber-900/30 transition-all flex items-center gap-2 shrink-0"
          >
            <DoorOpen className="w-4 h-4" />
            <span>60초 미궁 탈출 도전!</span>
          </button>
        </div>
      </div>

      {/* Header and User Quick Summary */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-2 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
            <Trophy className="w-4 h-4" />
            <span>{SCHOOL_NAME} 3학년 학급 대항전 & 개인 순위</span>
          </div>
          <h3 className="text-2xl font-extrabold text-stone-900 dark:text-stone-100">
            {selectedClass === 'tournament' 
              ? `🏆 ${SCHOOL_NAME} 학급 대항전 순위` 
              : selectedClass === 'all' 
              ? '전체 학급 통합 랭킹' 
              : `${selectedClass} 랭킹`}
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            반별 평균 점수, 탈출 성공자 수, 그리고 개인별 최고 속도 기록을 비교할 수 있습니다.
          </p>
        </div>

        {/* My Current Rank Badge */}
        <div className="flex items-center gap-3 bg-white dark:bg-stone-900 p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-sm">
            {myEntry ? `${myEntry.rank}위` : '-'}
          </div>
          <div className="text-left text-xs">
            <div className="font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <span>{userProfile.nickname}</span>
              <button
                onClick={() => setIsEditingProfile(true)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                title="내 정보(소속 반) 수정"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </div>
            <div className="text-[11px] text-stone-500">
              {SCHOOL_NAME} <span className="font-semibold text-amber-800 dark:text-amber-400">{userProfile.gradeClass || '학급 미선택'}</span>
            </div>
            {myEntry?.timeTakenSeconds && (
              <div className="text-[10px] text-amber-700 dark:text-amber-400 font-mono mt-0.5">
                ⏱️ 최고 속도: {myEntry.timeTakenSeconds}초 (문항당 {myEntry.speedPerQuestion ?? '-'}초)
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 서버(구글 시트) 동기화 상태 */}
      <div className="flex items-center justify-between gap-3 text-[11px] text-stone-500 dark:text-stone-400 -mt-4">
        <span>
          {!remoteEnabled
            ? '공용 랭킹 서버가 연결되지 않아 이 기기의 기록만 표시됩니다.'
            : syncState === 'syncing'
            ? '최신 기록을 불러오는 중...'
            : syncState === 'error'
            ? '서버에 연결하지 못했습니다. 마지막으로 불러온 기록을 표시합니다.'
            : '실제로 플레이한 기록만 표시됩니다.'}
        </span>
        {remoteEnabled && (
          <button
            onClick={onRefresh}
            disabled={syncState === 'syncing'}
            className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${syncState === 'syncing' ? 'animate-spin' : ''}`} />
            <span>새로고침</span>
          </button>
        )}
      </div>

      {/* Profile Edit Modal */}
      {isEditingProfile && (
        <div className="p-6 bg-stone-100 dark:bg-stone-800/80 rounded-2xl border border-stone-200 dark:border-stone-700 space-y-4">
          <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
            내 탐험가 정보 및 소속 학급 수정
          </h3>
          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] text-stone-500 block mb-1">닉네임</label>
              <input
                type="text"
                value={editNick}
                onChange={e => setEditNick(e.target.value)}
                maxLength={12}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 text-stone-900 dark:text-stone-100"
                required
              />
            </div>
            <div>
              <label className="text-[11px] text-stone-500 block mb-1">학교명</label>
              <input
                type="text"
                value={editSchool}
                readOnly
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-stone-200 dark:bg-stone-800 border border-stone-300 dark:border-stone-600 text-stone-500 dark:text-stone-400"
              />
            </div>
            <div>
              <label className="text-[11px] text-stone-500 block mb-1">학년 / 반 (학급)</label>
              <select
                value={editClass}
                onChange={e => setEditClass(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 text-stone-900 dark:text-stone-100"
              >
                {CLASSES_LIST.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3 flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="px-3 py-1.5 text-xs rounded-lg text-stone-600 dark:text-stone-400 hover:bg-stone-200"
              >
                취소
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-amber-700 text-white hover:bg-amber-800"
              >
                저장하기
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Primary Navigation: CLASS TABS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            학급 선택 (반별 랭킹)
          </span>

          {/* Sub-sort toggle: Score vs Speed */}
          {selectedClass !== 'tournament' && (
            <div className="flex items-center gap-1 bg-stone-200/80 dark:bg-stone-800/80 p-1 rounded-lg text-[11px]">
              <button
                onClick={() => setSortMetric('score')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  sortMetric === 'score'
                    ? 'bg-white dark:bg-stone-900 font-bold text-amber-800 dark:text-amber-300 shadow-xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                점수순
              </button>
              <button
                onClick={() => setSortMetric('speed')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  sortMetric === 'speed'
                    ? 'bg-amber-600 font-bold text-white shadow-xs'
                    : 'text-amber-800 dark:text-amber-400'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>탈출 속도순</span>
              </button>
              <button
                onClick={() => setSortMetric('combo')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                  sortMetric === 'combo'
                    ? 'bg-orange-500 font-bold text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400'
                }`}
              >
                <Flame className="w-3 h-3 text-orange-500" />
                <span>콤보순</span>
              </button>
            </div>
          )}
        </div>

        {/* Class Selection Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-stone-100 dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
          <button
            onClick={() => setSelectedClass('tournament')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedClass === 'tournament'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-amber-800 dark:text-amber-300 hover:bg-amber-100/60 dark:hover:bg-amber-950/40'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>🏆 학급 대항전 (반별 순위)</span>
          </button>

          <button
            onClick={() => setSelectedClass('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              selectedClass === 'all'
                ? 'bg-white dark:bg-stone-800 text-stone-950 dark:text-white shadow-sm border border-stone-300 dark:border-stone-700'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            전체 학급 통합
          </button>

          {CLASSES_LIST.map(cls => {
            const isUserClass = userProfile.gradeClass === cls;
            const isSelected = selectedClass === cls;
            return (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 ${
                  isSelected
                    ? 'bg-amber-700 text-white shadow-sm'
                    : 'text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-800'
                }`}
              >
                <Users className="w-3 h-3" />
                <span>{cls}</span>
                {isUserClass && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    isSelected ? 'bg-amber-900 text-amber-200' : 'bg-amber-200 dark:bg-amber-950 text-amber-900 dark:text-amber-300'
                  }`}>
                    우리반
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW 1: TOURNAMENT VIEW (Class vs Class Comparison) */}
      {selectedClass === 'tournament' ? (
        <div className="space-y-4">
          {classStats.length === 0 && (
            <div className="py-10 text-center text-xs text-stone-400 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800">
              아직 플레이 기록이 있는 학급이 없습니다. 미궁 탈출에 도전해 첫 기록을 남겨보세요!
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classStats.map((item, idx) => {
              const rank = idx + 1;
              const isFirst = rank === 1;
              const isSecond = rank === 2;
              const isThird = rank === 3;
              const isMyClass = userProfile.gradeClass === item.className;

              return (
                <div
                  key={item.className}
                  className={`p-5 rounded-2xl border transition-all ${
                    isMyClass
                      ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-400 dark:border-amber-700 shadow-md ring-1 ring-amber-400/40'
                      : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-xs ${
                        isFirst
                          ? 'bg-amber-400 text-amber-950 text-base'
                          : isSecond
                          ? 'bg-slate-300 text-slate-900 text-base'
                          : isThird
                          ? 'bg-amber-700 text-white text-base'
                          : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                      }`}>
                        {isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : `${rank}위`}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 font-bold text-base text-stone-900 dark:text-stone-100">
                          <span>{item.className}</span>
                          {isMyClass && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-600 text-white font-bold">
                              내 학급
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400">
                          참여 탐험가: {item.count}명
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-stone-400 font-medium">학급 평균 점수</div>
                      <div className="text-xl font-black font-mono tabular-nums text-amber-800 dark:text-amber-400">
                        {item.avgScore.toLocaleString()}점
                      </div>
                    </div>
                  </div>

                  {/* Highlights Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
                    <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800/60">
                      <span className="text-stone-400 block text-[11px]">지상 탈출 성공자</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{item.escapes}명 탈출 완료</span>
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800/60">
                      <span className="text-stone-400 block text-[11px]">반 1위 최고 득점자</span>
                      <span className="font-bold text-stone-800 dark:text-stone-200 truncate block mt-0.5">
                        {item.bestStudent ? `${item.bestStudent.nickname} (${item.bestStudent.score}점)` : '-'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedClass(item.className)}
                    className="w-full mt-3 py-2 text-xs font-semibold rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors flex items-center justify-center gap-1"
                  >
                    <span>{item.className} 학생별 순위 보기</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* VIEW 2: STUDENT RANKINGS TABLE (Filtered by class) */
        <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-stone-50 dark:bg-stone-800/60 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between text-xs">
            <span className="font-bold text-stone-700 dark:text-stone-300">
              {selectedClass === 'all' ? '전체 학급' : selectedClass} 탐험가 명단 (총 {displayedList.length}명)
            </span>
            <span className="text-stone-400">
              정렬: {sortMetric === 'speed' ? '탈출 속도순' : sortMetric === 'combo' ? '연속 콤보순' : '퀴즈 점수순'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50/50 dark:bg-stone-800/40 border-b border-stone-200 dark:border-stone-800 text-stone-500 dark:text-stone-400 font-semibold">
                <tr>
                  <th className="py-3 px-4 w-14 text-center">순위</th>
                  <th className="py-3 px-4">탐험가 (닉네임 / 소속 학급)</th>
                  <th className="py-3 px-4">던전 탈출 위치</th>
                  <th className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span>소요 시간 / 속도</span>
                    </div>
                  </th>
                  <th className="py-3 px-4 text-right">점수</th>
                  <th className="py-3 px-4 text-center hidden md:table-cell">정답률</th>
                  <th className="py-3 px-4 text-center">최대 콤보</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {displayedList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-stone-400">
                      해당 학급에 등록된 랭킹 기록이 아직 없습니다. 미궁 탈출에 도전해보세요!
                    </td>
                  </tr>
                ) : (
                  displayedList.map((entry, index) => {
                    const rankNumber = index + 1;
                    const isTop1 = rankNumber === 1;
                    const isTop2 = rankNumber === 2;
                    const isTop3 = rankNumber === 3;
                    const isSelf = entry.isCurrentUser;
                    const isEscaped = (entry.escapeRate ?? 0) >= 100 || entry.escapeFloor?.includes('지상 탈출');

                    return (
                      <tr
                        key={entry.id}
                        className={`transition-colors ${
                          isSelf
                            ? 'bg-amber-50/90 dark:bg-amber-950/40 font-semibold ring-1 ring-inset ring-amber-400/30'
                            : 'hover:bg-stone-50/60 dark:hover:bg-stone-800/40'
                        }`}
                      >
                        {/* Rank Column */}
                        <td className="py-3.5 px-4 text-center font-bold font-mono">
                          {isTop1 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-amber-950 text-xs shadow-xs font-bold">
                              🥇
                            </span>
                          ) : isTop2 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-800 text-xs shadow-xs font-bold">
                              🥈
                            </span>
                          ) : isTop3 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700 text-amber-100 text-xs shadow-xs font-bold">
                              🥉
                            </span>
                          ) : (
                            <span className="text-stone-500 dark:text-stone-400 tabular-nums">
                              {rankNumber}
                            </span>
                          )}
                        </td>

                        {/* Explorer Nickname & School */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border ${
                              isSelf
                                ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                                : 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700'
                            }`}>
                              {entry.nickname.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 font-bold text-stone-900 dark:text-stone-100">
                                <span>{entry.nickname}</span>
                                {isSelf && (
                                  <span className="text-[10px] px-1.5 py-0.2 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200 rounded font-semibold">
                                    나
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-stone-500 dark:text-stone-400">
                                <span className="font-semibold text-amber-800 dark:text-amber-400">{entry.gradeClass}</span> · {entry.title}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Dungeon Escape Status */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              {isEscaped ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                                  <span>🏆 탈출 성공!</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 text-[10px] font-medium">
                                  <span>{entry.escapeFloor || 'B15층 탐험 중'}</span>
                                </span>
                              )}
                            </div>
                            {entry.escapeRate !== undefined && (
                              <div className="w-24 bg-stone-200 dark:bg-stone-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    isEscaped ? 'bg-emerald-500' : 'bg-amber-500'
                                  }`}
                                  style={{ width: `${Math.min(100, entry.escapeRate)}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Time taken & Speed per question */}
                        <td className="py-3.5 px-4 text-center">
                          {entry.timeTakenSeconds ? (
                            <div className="font-mono text-xs">
                              <span className="font-bold text-amber-800 dark:text-amber-300">
                                {entry.timeTakenSeconds}초
                              </span>
                              {entry.speedPerQuestion && (
                                <div className="text-[10px] text-stone-400">
                                  ({entry.speedPerQuestion}초/문항)
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-stone-400 text-[11px]">-</span>
                          )}
                        </td>

                        {/* Score */}
                        <td className="py-3.5 px-4 text-right">
                          <span className="font-mono tabular-nums font-extrabold text-sm text-amber-800 dark:text-amber-400">
                            {entry.score.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-stone-400 ml-1">점</span>
                        </td>

                        {/* Accuracy */}
                        <td className="py-3.5 px-4 text-center hidden md:table-cell font-mono tabular-nums text-stone-600 dark:text-stone-300">
                          {entry.accuracy}%
                        </td>

                        {/* Max Combo */}
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 font-mono font-bold tabular-nums">
                            <Flame className="w-3.5 h-3.5 fill-current" />
                            <span>{entry.maxCombo}회</span>
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
