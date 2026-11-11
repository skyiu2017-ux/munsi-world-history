import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { ChapterExplorer } from './components/ChapterExplorer';
import { QuizEngine } from './components/QuizEngine';
import { SpeedChallenge } from './components/SpeedChallenge';
import { LeaderboardView } from './components/LeaderboardView';
import { WrongNotesClinic } from './components/WrongNotesClinic';
import { ProfileModal } from './components/ProfileModal';
import { ProfileSetupModal } from './components/ProfileSetupModal';
import { isRemoteEnabled } from './services/remoteLeaderboard';

import { ProgressDashboard } from './components/ProgressDashboard';
import { DailyKeywordModal } from './components/DailyKeywordModal';
import { getDailyQuizForToday } from './data/dailyKeywordsData';

import { CHAPTERS_DATA } from './data/chaptersData';
import { QUESTIONS_DATA } from './data/questionsData';
import { storageService } from './services/storageService';
import { PixelExplorer } from './components/PixelExplorer';
import { 
  UserProfile, LeaderboardEntry, WrongNoteItem, 
  QuizSessionConfig, Difficulty, Question, QuizAttemptRecord 
} from './types/history';

import confetti from 'canvas-confetti';
import { Trophy, Award, RotateCcw, ArrowRight, CheckCircle2, Flame, Sparkles, Clock, Compass } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('explore');
  const [isDark, setIsDark] = useState<boolean>(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => storageService.getUserProfile());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => storageService.getLeaderboard());
  const [wrongNotes, setWrongNotes] = useState<WrongNoteItem[]>(() => storageService.getWrongNotes());
  const [historyRecords, setHistoryRecords] = useState<QuizAttemptRecord[]>(() => storageService.getQuizHistory());
  
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [quizConfig, setQuizConfig] = useState<QuizSessionConfig | null>(null);

  // Result popup modal
  const [lastQuizResult, setLastQuizResult] = useState<{
    score: number;
    accuracy: number;
    maxCombo: number;
    totalAnswered: number;
    correctCount: number;
    gainedXP: number;
    leveledUp: boolean;
    newRank?: number;
    timeTakenSeconds?: number;
    speedPerQuestion?: number;
    escapeFloor?: string;
  } | null>(null);

  const [isDailyModalOpen, setIsDailyModalOpen] = useState<boolean>(false);
  const todayQuiz = getDailyQuizForToday();

  // Daily Quiz auto-popup on access if not dismissed today
  useEffect(() => {
    try {
      const todayDateStr = new Date().toISOString().slice(0, 10);
      const lastDismissed = localStorage.getItem('wh_daily_keyword_dismissed_date');
      if (lastDismissed !== todayDateStr) {
        const timer = setTimeout(() => {
          setIsDailyModalOpen(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleCloseDailyModal = (dontShowToday?: boolean) => {
    setIsDailyModalOpen(false);
    if (dontShowToday) {
      try {
        const todayDateStr = new Date().toISOString().slice(0, 10);
        localStorage.setItem('wh_daily_keyword_dismissed_date', todayDateStr);
      } catch (e) {}
    }
  };

  const handleRewardDailyXP = (amount: number) => {
    const { profile } = storageService.addXP(amount);
    setUserProfile({ ...profile });
    try {
      const todayDateStr = new Date().toISOString().slice(0, 10);
      localStorage.setItem('wh_daily_keyword_dismissed_date', todayDateStr);
    } catch (e) {}
  };

  // Sync dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const toggleDarkMode = () => {
    setIsDark(prev => !prev);
  };

  // 학급 랭킹 서버(구글 시트) 동기화
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'error'>('idle');
  const syncLeaderboard = async () => {
    if (!isRemoteEnabled()) return;
    setSyncState('syncing');
    const result = await storageService.syncLeaderboardWithServer();
    setLeaderboard(storageService.getLeaderboard());
    setSyncState(result === 'error' ? 'error' : 'idle');
  };

  // 앱을 열 때와 랭킹 탭에 들어올 때 최신 기록을 받아옵니다.
  useEffect(() => {
    if (currentTab === 'explore' || currentTab === 'leaderboard') {
      syncLeaderboard();
    }
  }, [currentTab]);

  const handleUpdateProfile = (nickname: string, schoolName: string, gradeClass: string, studentName?: string, studentNumber?: number) => {
    const updated = storageService.updateProfileDetails(nickname, schoolName, gradeClass, studentName, studentNumber);
    setUserProfile(updated);
    setLeaderboard(storageService.getLeaderboard());
    syncLeaderboard();
  };

  // Check achievements helper
  const checkAchievements = (profile: UserProfile, maxCombo: number, score: number, mode: string) => {
    let changed = false;
    const achievements = profile.achievements.map(ach => {
      let isUnlocked = ach.unlocked;

      if (!isUnlocked) {
        if (ach.id === 'first-step') {
          isUnlocked = true;
          changed = true;
        } else if (ach.id === 'combo-5' && maxCombo >= 5) {
          isUnlocked = true;
          changed = true;
        } else if (ach.id === 'combo-10' && maxCombo >= 10) {
          isUnlocked = true;
          changed = true;
        } else if (ach.id === 'speed-king' && mode === 'speed' && score >= 1000) {
          isUnlocked = true;
          changed = true;
        } else if (ach.id === 'world-historian' && profile.completedChapters.length >= 15) {
          isUnlocked = true;
          changed = true;
        }
      }

      return {
        ...ach,
        unlocked: isUnlocked,
        progress: isUnlocked ? ach.maxProgress : ach.progress
      };
    });

    if (changed) {
      profile.achievements = achievements;
      storageService.saveUserProfile(profile);
      setUserProfile({ ...profile });
    }
  };

  const startChapterQuiz = (chapterId: number, difficulty: Difficulty) => {
    setQuizConfig({
      mode: 'chapter',
      chapterId,
      initialDifficulty: difficulty,
      questionCount: 5
    });
    setCurrentTab('quizSession');
  };

  const startAdaptiveQuiz = () => {
    setQuizConfig({
      mode: 'adaptive',
      initialDifficulty: '초급',
      questionCount: 10
    });
    setCurrentTab('quizSession');
  };

  const startWrongReviewQuiz = (customQuestions?: Question[]) => {
    setQuizConfig({
      mode: 'wrongReview',
      questionCount: customQuestions ? customQuestions.length : 6
    });
    setCurrentTab('quizSession');
  };

  const handleFinishQuiz = (result: {
    score: number;
    accuracy: number;
    maxCombo: number;
    totalAnswered: number;
    correctCount: number;
    timeTakenSeconds?: number;
    speedPerQuestion?: number;
    escapeFloor?: string;
  }) => {
    // Calculate XP
    const gainedXP = Math.round(result.score / 8) + (result.correctCount * 15);
    const { profile, leveledUp } = storageService.addXP(gainedXP);

    // If chapter quiz, mark as completed
    if (quizConfig?.chapterId) {
      storageService.markChapterCompleted(quizConfig.chapterId);
      profile.completedChapters = storageService.getUserProfile().completedChapters;
    }

    const escapeRate = result.escapeFloor?.includes('지상 탈출')
      ? 100
      : Math.min(95, Math.round((result.score / 1500) * 100));

    // Record score on leaderboard
    const { newRank } = storageService.recordQuizScore(
      result.score,
      result.accuracy,
      result.maxCombo,
      quizConfig?.mode || 'adaptive',
      {
        timeTakenSeconds: result.timeTakenSeconds,
        speedPerQuestion: result.speedPerQuestion,
        escapeFloor: result.escapeFloor,
        escapeRate
      }
    );

    checkAchievements(profile, result.maxCombo, result.score, quizConfig?.mode || 'adaptive');
    setUserProfile({ ...profile });
    setLeaderboard(storageService.getLeaderboard());
    setWrongNotes(storageService.getWrongNotes());
    syncLeaderboard();

    // Save attempt record for progress trend
    const newRecord: QuizAttemptRecord = {
      id: `att-${Date.now()}`,
      date: '방금',
      timeLabel: `${historyRecords.length + 1}회차`,
      score: result.score,
      accuracy: result.accuracy,
      maxCombo: result.maxCombo,
      mode: quizConfig?.mode === 'adaptive' ? '적응형' : '단원 퀴즈',
      timeTakenSeconds: result.timeTakenSeconds,
      speedPerQuestion: result.speedPerQuestion,
      escapeFloor: result.escapeFloor
    };
    storageService.addQuizAttempt(newRecord);
    setHistoryRecords(storageService.getQuizHistory());

    setLastQuizResult({
      ...result,
      gainedXP,
      leveledUp,
      newRank
    });
  };

  const handleFinishSpeedChallenge = (result: {
    score: number;
    maxCombo: number;
    accuracy: number;
    timeTakenSeconds: number;
    speedPerQuestion: number;
    escapeFloor: string;
  }) => {
    const gainedXP = Math.round(result.score / 6);
    const { profile, leveledUp } = storageService.addXP(gainedXP);

    const isEscaped = result.escapeFloor.includes('지상 탈출');
    const escapeRate = isEscaped ? 100 : Math.min(95, Math.round((result.score / 1500) * 100));

    const { newRank } = storageService.recordQuizScore(
      result.score,
      result.accuracy,
      result.maxCombo,
      'speed',
      {
        timeTakenSeconds: result.timeTakenSeconds,
        speedPerQuestion: result.speedPerQuestion,
        escapeFloor: result.escapeFloor,
        escapeRate
      }
    );
    checkAchievements(profile, result.maxCombo, result.score, 'speed');

    setUserProfile({ ...profile });
    setLeaderboard(storageService.getLeaderboard());
    setWrongNotes(storageService.getWrongNotes());
    syncLeaderboard();

    const newRecord: QuizAttemptRecord = {
      id: `att-${Date.now()}`,
      date: '방금',
      timeLabel: `${historyRecords.length + 1}회차`,
      score: result.score,
      accuracy: result.accuracy,
      maxCombo: result.maxCombo,
      mode: '스피드 배틀',
      timeTakenSeconds: result.timeTakenSeconds,
      speedPerQuestion: result.speedPerQuestion,
      escapeFloor: result.escapeFloor
    };
    storageService.addQuizAttempt(newRecord);
    setHistoryRecords(storageService.getQuizHistory());

    setLastQuizResult({
      score: result.score,
      accuracy: result.accuracy,
      maxCombo: result.maxCombo,
      totalAnswered: Math.round(result.score / 100),
      correctCount: Math.round((result.score / 100) * (result.accuracy / 100)),
      gainedXP,
      leveledUp,
      newRank,
      timeTakenSeconds: result.timeTakenSeconds,
      speedPerQuestion: result.speedPerQuestion,
      escapeFloor: result.escapeFloor
    });
  };

  const closeResultModal = () => {
    setLastQuizResult(null);
    setQuizConfig(null);
    setCurrentTab('explore');
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col transition-colors selection:bg-amber-200 selection:text-amber-950">
      {/* Universal Top Navigation Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={tab => {
          setQuizConfig(null);
          setCurrentTab(tab);
        }}
        userProfile={userProfile}
        isDark={isDark}
        onToggleDark={toggleDarkMode}
        onOpenProfile={() => setIsProfileOpen(true)}
        onOpenDailyQuiz={() => setIsDailyModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {currentTab === 'quizSession' && quizConfig ? (
          <QuizEngine
            questions={
              quizConfig.mode === 'wrongReview' && wrongNotes.length > 0
                ? wrongNotes.map(n => n.question)
                : QUESTIONS_DATA
            }
            config={quizConfig}
            userProfile={userProfile}
            onFinishQuiz={handleFinishQuiz}
            onExit={() => {
              setQuizConfig(null);
              setCurrentTab('explore');
            }}
          />
        ) : currentTab === 'speed' ? (
          <SpeedChallenge
            questions={QUESTIONS_DATA}
            userProfile={userProfile}
            onFinish={handleFinishSpeedChallenge}
            onExit={() => setCurrentTab('explore')}
          />
        ) : currentTab === 'leaderboard' ? (
          <LeaderboardView
            entries={leaderboard}
            userProfile={userProfile}
            onUpdateProfile={handleUpdateProfile}
            onStartChallenge={() => setCurrentTab('speed')}
            remoteEnabled={isRemoteEnabled()}
            syncState={syncState}
            onRefresh={syncLeaderboard}
          />
        ) : currentTab === 'dashboard' ? (
          <ProgressDashboard
            userProfile={userProfile}
            chapters={CHAPTERS_DATA}
            wrongNotes={wrongNotes}
            historyRecords={historyRecords}
            onSelectChapter={(chId) => {
              setCurrentTab('explore');
              startChapterQuiz(chId, '중급');
            }}
            onStartAdaptive={startAdaptiveQuiz}
          />
        ) : currentTab === 'notes' ? (
          <WrongNotesClinic
            wrongNotes={wrongNotes}
            onRefreshNotes={() => setWrongNotes(storageService.getWrongNotes())}
            onStartWrongQuiz={questions => startWrongReviewQuiz(questions)}
          />
        ) : (
          /* Default: Explore / Dashboard */
          <>
            <HeroBanner
              onStartAdaptive={startAdaptiveQuiz}
              onStartSpeed={() => setCurrentTab('speed')}
              onExploreChapters={() => {
                const el = document.getElementById('chapter-explorer');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              onOpenDailyQuiz={() => setIsDailyModalOpen(true)}
              totalChaptersCount={CHAPTERS_DATA.length}
            />

            <div id="chapter-explorer">
              <ChapterExplorer
                chapters={CHAPTERS_DATA}
                completedChapterIds={userProfile.completedChapters}
                onStartQuiz={startChapterQuiz}
                onStartAdaptive={startAdaptiveQuiz}
              />
            </div>
          </>
        )}
      </main>

      {/* 최초 접속 시 닉네임·학급 설정 (완료 전에는 기록이 랭킹에 올라가지 않도록) */}
      {!userProfile.profileSetupDone && (
        <ProfileSetupModal
          defaultNickname={userProfile.nickname}
          onSubmit={(nickname, gradeClass, studentName, studentNumber) => handleUpdateProfile(nickname, userProfile.schoolName, gradeClass, studentName, studentNumber)}
        />
      )}

      {/* Profile & Achievements Modal */}
      <ProfileModal
        userProfile={userProfile}
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        onUpdateProfile={handleUpdateProfile}
      />

      {/* Daily History Keyword Quiz Popup Modal */}
      <DailyKeywordModal
        quiz={todayQuiz}
        isOpen={isDailyModalOpen}
        onClose={handleCloseDailyModal}
        onRewardXP={handleRewardDailyXP}
      />

      {/* Quiz Completion Result Modal */}
      {lastQuizResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/75 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-stone-900 rounded-3xl border-2 border-amber-600/60 dark:border-amber-500/40 shadow-2xl max-w-md w-full p-6 text-center space-y-5">
            {/* Pixel Explorer Graphic Header */}
            <div className="relative mx-auto w-24 h-24 bg-stone-950 rounded-2xl border-2 border-amber-600 flex items-center justify-center p-2 shadow-inner">
              <PixelExplorer state="cheering" isSweating={false} />
              <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-amber-500 text-stone-950 flex items-center justify-center font-bold text-xs shadow-md">
                ★
              </div>
            </div>

            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-800 text-[11px] font-pixel text-amber-800 dark:text-amber-300">
                <Compass className="w-3 h-3 text-amber-600" />
                <span>DUNGEON EXPEDITION COMPLETE</span>
              </div>
              <h3 className="text-2xl font-black text-stone-900 dark:text-stone-100 font-display">
                {lastQuizResult.escapeFloor?.includes('지상 탈출')
                  ? '지상 미궁 탈출 성공! 🏆'
                  : '던전 탐험 완료!'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {lastQuizResult.escapeFloor ? (
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    도달 위치: {lastQuizResult.escapeFloor}
                  </span>
                ) : (
                  '세계사 지식으로 지하 미궁을 밝혀냈습니다.'
                )}
              </p>
            </div>

            {/* Score, Time, Speed & XP Grid */}
            <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/80 grid grid-cols-2 gap-3 text-xs">
              <div className="p-2">
                <span className="text-stone-400 block mb-0.5">최종 점수</span>
                <span className="font-mono tabular-nums font-black text-xl text-amber-800 dark:text-amber-400">
                  {lastQuizResult.score.toLocaleString()} 점
                </span>
              </div>
              <div className="p-2">
                <span className="text-stone-400 block mb-0.5">획득 경험치</span>
                <span className="font-mono tabular-nums font-black text-xl text-emerald-600 dark:text-emerald-400">
                  +{lastQuizResult.gainedXP} XP
                </span>
              </div>

              {lastQuizResult.timeTakenSeconds !== undefined && (
                <div className="p-2 border-t border-stone-200 dark:border-stone-700/60">
                  <span className="text-stone-400 block mb-0.5">탈출 소요 시간</span>
                  <span className="font-mono tabular-nums font-bold text-base text-stone-900 dark:text-stone-100 flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    <span>{lastQuizResult.timeTakenSeconds}초</span>
                  </span>
                </div>
              )}

              {lastQuizResult.speedPerQuestion !== undefined && (
                <div className="p-2 border-t border-stone-200 dark:border-stone-700/60">
                  <span className="text-stone-400 block mb-0.5">문제당 평균 속도</span>
                  <span className="font-mono tabular-nums font-bold text-base text-amber-700 dark:text-amber-300">
                    {lastQuizResult.speedPerQuestion}초/문항
                  </span>
                </div>
              )}

              <div className="p-2 border-t border-stone-200 dark:border-stone-700/60">
                <span className="text-stone-400 block mb-0.5">정답률</span>
                <span className="font-mono tabular-nums font-bold text-base text-stone-900 dark:text-stone-100">
                  {lastQuizResult.accuracy}%
                </span>
              </div>
              <div className="p-2 border-t border-stone-200 dark:border-stone-700/60">
                <span className="text-stone-400 block mb-0.5">최대 연속 정답</span>
                <span className="font-mono tabular-nums font-bold text-base text-orange-600 dark:text-orange-400 flex items-center justify-center gap-1">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>{lastQuizResult.maxCombo} 콤보</span>
                </span>
              </div>
            </div>

            {/* Level Up Notice if any */}
            {lastQuizResult.leveledUp && (
              <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 text-xs font-bold flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>축하합니다! 레벨 {userProfile.level}로 승급되었습니다!</span>
              </div>
            )}

            {lastQuizResult.newRank && (
              <div className="text-xs text-stone-600 dark:text-stone-300">
                현재 우리 학교/학급 랭킹 <span className="font-bold text-amber-700 dark:text-amber-400">{lastQuizResult.newRank}위</span>에 등극했습니다!
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                onClick={() => {
                  setLastQuizResult(null);
                  setCurrentTab('leaderboard');
                }}
                className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-amber-100/80 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 hover:bg-amber-200 transition-colors flex items-center justify-center gap-1 border border-amber-300 dark:border-amber-800"
              >
                <Trophy className="w-3.5 h-3.5 text-amber-600" />
                <span>각 학급 랭킹</span>
              </button>
              <button
                onClick={() => {
                  setLastQuizResult(null);
                  setCurrentTab('speed');
                }}
                className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-orange-600 hover:bg-orange-700 text-white transition-colors flex items-center justify-center gap-1 shadow-xs"
              >
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>미궁 다시 탈출</span>
              </button>
              <button
                onClick={closeResultModal}
                className="flex-1 py-2.5 text-xs font-bold rounded-xl bg-stone-900 hover:bg-black dark:bg-stone-800 dark:hover:bg-stone-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1"
              >
                <span>시대별 개념</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clean Editorial Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 py-8 text-xs text-stone-500 text-center">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <div className="flex items-center justify-center gap-4 text-stone-600 dark:text-stone-400 font-medium">
            <span>미래엔 중학 역사① (세계사) 교과서 연계</span>
            <span aria-hidden="true">·</span>
            <span>4대 문명부터 제국주의까지</span>
            <span aria-hidden="true">·</span>
            <span>적응형 문제은행 & 학급 랭킹전</span>
          </div>
          <div>
            © 2026 중3 세계사 마스터. 모든 역사 교육 콘텐츠는 대한민국 중학교 교과 기준을 준수합니다.
          </div>
        </div>
      </footer>
    </div>
  );
}
