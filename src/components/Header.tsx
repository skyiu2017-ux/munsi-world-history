import React from 'react';
import { UserProfile } from '../types/history';
import { BookOpen, Trophy, Flame, User, Sun, Moon, BarChart3, Sparkles, Menu } from 'lucide-react';

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
    <>
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-stone-900/90 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 md:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onSelectTab('explore')}
          className="flex items-center gap-2 text-left group shrink-0 min-w-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-700 dark:bg-amber-600 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="font-display font-extrabold text-sm sm:text-lg tracking-tight text-stone-900 dark:text-stone-100 whitespace-nowrap">
              <span className="sm:hidden">세계사</span><span className="hidden sm:inline">중3 세계사 마스터</span>
            </span>
            <span className="hidden sm:inline-block text-xs text-stone-500 dark:text-stone-400 ml-2">
              중학 역사① · 세계사
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
            단원별 학습
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
        <div className="flex items-center gap-1 sm:gap-2.5 shrink-0">
          <a
            href="https://skyiu2017-ux.github.io/history-class/"
            title="문시중 역사 포털로 돌아가기"
            className="hidden sm:inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-semibold text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            <span className="hidden lg:inline">역사 포털</span>
          </a>

          {/* Daily Keyword Quiz Button */}
          <button
            onClick={onOpenDailyQuiz}
            className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-semibold hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
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
            className="flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 hover:bg-amber-100/60 dark:hover:bg-amber-950/40 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 text-xs font-medium transition-colors"
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
      {/* 화면이 작은 휴대전화에서도 모든 메뉴에 접근할 수 있는 고정 하단 메뉴 */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 grid grid-cols-4 border-t border-stone-200 dark:border-stone-700 bg-white/95 dark:bg-stone-900/95 backdrop-blur-lg shadow-[0_-4px_18px_rgba(0,0,0,0.1)] pb-[env(safe-area-inset-bottom)]" aria-label="모바일 주요 메뉴">
        {([
          { tab: 'explore', label: '단원별 학습', Icon: BookOpen },
          { tab: 'speed', label: '미궁 탈출', Icon: Flame },
          { tab: 'dashboard', label: '대시보드', Icon: BarChart3 },
          { tab: 'leaderboard', label: '학급 랭킹', Icon: Trophy }
        ] as const).map(({tab,label,Icon}) => (
          <button key={tab} type="button" onClick={() => { onSelectTab(tab); window.scrollTo({top: 0, behavior: 'smooth'}); }}
            aria-current={currentTab===tab ? 'page' : undefined}
            className={`flex flex-col items-center justify-center min-h-[64px] px-1 py-2 gap-1 text-[11px] font-bold transition-colors ${currentTab === tab ? 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40' : 'text-stone-600 dark:text-stone-300'}`}>
            <Icon className="w-5 h-5" aria-hidden="true" />
            <span className="whitespace-nowrap">{label}</span>
          </button>
        ))}
      </nav>
    </>
  );
};
