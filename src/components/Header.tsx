import React from 'react';
import { UserProfile } from '../types/history';
import { BookOpen, Trophy, Flame, User, Sun, Moon, BarChart3, Sparkles } from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  userProfile: UserProfile;
  isDark: boolean;
  onToggleDark: () => void;
  onOpenProfile: () => void;
  onOpenDailyQuiz: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  userProfile,
  isDark,
  onToggleDark,
  onOpenProfile,
  onOpenDailyQuiz
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onSelectTab('explore')}
          className="flex items-center gap-2.5 text-left group shrink-0"
        >
          <div className="w-9 h-9 rounded-lg bg-amber-700 dark:bg-amber-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display font-extrabold text-lg tracking-tight text-stone-900 dark:text-stone-100 whitespace-nowrap">
              중3 세계사 마스터
            </span>
            <span className="hidden sm:inline-block text-xs text-stone-500 dark:text-stone-400 ml-2">
              중학 역사② 전 범위
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links (single line, clean typography) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => onSelectTab('explore')}
            className={`whitespace-nowrap transition-colors py-1 ${
              currentTab === 'explore'
                ? 'text-amber-800 dark:text-amber-400 border-b-2 border-amber-700 font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100'
            }`}
          >
            시대별 탐험 & 개념
          </button>
          <button
            onClick={() => onSelectTab('adaptive')}
            className={`whitespace-nowrap transition-colors py-1 ${
              currentTab === 'adaptive'
                ? 'text-amber-800 dark:text-amber-400 border-b-2 border-amber-700 font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100'
            }`}
          >
            적응형 퀴즈
          </button>
          <button
            onClick={() => onSelectTab('speed')}
            className={`whitespace-nowrap transition-colors py-1 flex items-center gap-1 ${
              currentTab === 'speed'
                ? 'text-amber-800 dark:text-amber-400 border-b-2 border-amber-700 font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-600" />
            <span>미궁 탈출 (60초)</span>
          </button>
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`whitespace-nowrap transition-colors py-1 flex items-center gap-1 ${
              currentTab === 'dashboard'
                ? 'text-amber-800 dark:text-amber-400 border-b-2 border-amber-700 font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
            <span>진도 대시보드</span>
          </button>
          <button
            onClick={() => onSelectTab('leaderboard')}
            className={`whitespace-nowrap transition-colors py-1 flex items-center gap-1 ${
              currentTab === 'leaderboard'
                ? 'text-amber-800 dark:text-amber-400 border-b-2 border-amber-700 font-semibold'
                : 'text-stone-600 dark:text-stone-400 hover:text-stone-950 dark:hover:text-stone-100'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            <span>각 학급 랭킹</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action & Utilities */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Daily Keyword Quiz Button */}
          <button
            onClick={onOpenDailyQuiz}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
            title="오늘의 역사 키워드 퀴즈 풀기"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">오늘의 키워드</span>
          </button>

          {/* Dark Mode Switch */}
          <button
            onClick={onToggleDark}
            aria-label="화면 모드 전환"
            className="p-2 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User Profile Pill button */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-amber-100/60 dark:hover:bg-amber-950/40 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 text-xs font-medium transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-bold">
              {userProfile.level}
            </div>
            <div className="flex flex-col text-left leading-none">
              <span className="font-semibold text-stone-900 dark:text-stone-100 max-w-[80px] sm:max-w-[110px] truncate">
                {userProfile.nickname}
              </span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400">
                {userProfile.gradeClass || '학급 미선택'}
              </span>
            </div>
            <User className="w-3.5 h-3.5 text-stone-400" />
          </button>
        </div>
      </div>
    </header>
  );
};
