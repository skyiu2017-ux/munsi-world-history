import { UserProfile, LeaderboardEntry, WrongNoteItem, Question, QuizAttemptRecord } from '../types/history';
import { INITIAL_ACHIEVEMENTS } from '../data/achievementsData';
import { SCHOOL_NAME, GRADE, isValidClass } from '../data/schoolConfig';
import { isRemoteEnabled, fetchRemoteLeaderboard, submitRemoteEntry } from './remoteLeaderboard';

const STORAGE_KEYS = {
  PROFILE: 'wh_quiz_user_profile',
  WRONG_NOTES: 'wh_quiz_wrong_notes',
  LEADERBOARD: 'wh_quiz_leaderboard',
  HISTORY: 'wh_quiz_attempt_history',
  PLAYER_ID: 'wh_quiz_player_id',
  PENDING_SYNC: 'wh_quiz_pending_sync' // 'played' | 'profile' : 서버에 아직 못 올린 내 기록
};

// 응시 기록은 실제로 푼 퀴즈만 담습니다. (예시용 가짜 기록 없음)
const DEFAULT_HISTORY: QuizAttemptRecord[] = [];

const rankEntries = (entries: LeaderboardEntry[]): LeaderboardEntry[] => {
  entries.sort((a, b) => b.score - a.score);
  entries.forEach((e, idx) => {
    e.rank = idx + 1;
  });
  return entries;
};

const DEFAULT_PROFILE: UserProfile = {
  nickname: '세계사탐험가',
  schoolName: SCHOOL_NAME,
  gradeClass: '',
  studentName: '',
  studentNumber: undefined,
  profileSetupDone: false,
  level: 1,
  xp: 0,
  title: '역사의 견습생',
  totalQuizzesTaken: 0,
  totalCorrect: 0,
  highScoreSpeed: 0,
  highScoreAdaptive: 0,
  completedChapters: [],
  achievements: INITIAL_ACHIEVEMENTS
};

// 랭킹은 실제로 플레이한 기록만 담습니다. (예시용 가짜 기록 없음)
const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [];

export const LEVEL_TITLES = [
  { minLevel: 1, title: '역사의 견습생' },
  { minLevel: 2, title: '문명의 답사자' },
  { minLevel: 3, title: '고대 제국의 기록관' },
  { minLevel: 4, title: '지중해의 탐험가' },
  { minLevel: 5, title: '중세의 지식 기사' },
  { minLevel: 6, title: '르네상스 인문학자' },
  { minLevel: 7, title: '대항해시대 항해사' },
  { minLevel: 8, title: '시민 혁명의 기수' },
  { minLevel: 9, title: '세계사 원로원 의원' },
  { minLevel: 10, title: '인류 문명의 수호자' }
];

export const getTitleForLevel = (level: number): string => {
  const match = [...LEVEL_TITLES].reverse().find(t => level >= t.minLevel);
  return match ? match.title : '역사의 견습생';
};

export const getLevelFromXP = (xp: number): number => {
  // 100 XP per level scaling slightly
  return Math.min(10, Math.floor(xp / 120) + 1);
};

let syncQueue: Promise<unknown> = Promise.resolve();

export const storageService = {
  getUserProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (data) {
        const parsed = JSON.parse(data);
        const setupDone = parsed.profileSetupDone === true && isValidClass(parsed.gradeClass) &&
          /^.{2,20}$/.test(String(parsed.studentName || '').trim()) &&
          Number.isInteger(Number(parsed.studentNumber)) && Number(parsed.studentNumber) >= 1 && Number(parsed.studentNumber) <= 45;
        return {
          ...DEFAULT_PROFILE,
          ...parsed,
          schoolName: SCHOOL_NAME,
          gradeClass: setupDone ? parsed.gradeClass : '',
          studentName: setupDone ? parsed.studentName : '',
          studentNumber: setupDone ? Number(parsed.studentNumber) : undefined,
          profileSetupDone: setupDone,
          achievements: DEFAULT_PROFILE.achievements.map(defaultAch => {
            const existing = parsed.achievements?.find((a: any) => a.id === defaultAch.id);
            return existing || defaultAch;
          })
        };
      }
    } catch (e) {
      console.error('Failed to load profile', e);
    }
    return { ...DEFAULT_PROFILE };
  },

  saveUserProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch (e) {
      console.error('Failed to save profile', e);
    }
  },

  updateProfileDetails(nickname: string, schoolName: string, gradeClass: string, studentName?: string, studentNumber?: number): UserProfile {
    const profile = this.getUserProfile();
    const oldId = this.getPlayerId();
    profile.nickname = nickname.trim() || profile.nickname;
    profile.schoolName = SCHOOL_NAME;
    // 학년·반·번호는 최초 등록 후 잠금. 수정은 교사에게 요청해야 합니다.
    if (!profile.profileSetupDone && isValidClass(gradeClass.trim()) &&
        studentName && studentName.trim().length >= 2 &&
        Number.isInteger(studentNumber) && Number(studentNumber) >= 1 && Number(studentNumber) <= 45) {
      profile.gradeClass = gradeClass.trim();
      profile.studentName = studentName.trim().slice(0, 20);
      profile.studentNumber = Number(studentNumber);
      profile.profileSetupDone = true;
    }
    if (profile.profileSetupDone) {
      const newId = `stu-${GRADE}-${Number(/(\d+)반/.exec(profile.gradeClass)?.[1] || 0)}-${profile.studentNumber}`;
      try {
        const entries = JSON.parse(localStorage.getItem(STORAGE_KEYS.LEADERBOARD) || '[]') as LeaderboardEntry[];
        if (oldId !== newId) {
          const migrated = entries.map(e => e.id === oldId ? { ...e, id: newId } : e);
          localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(migrated));
        }
      } catch (e) {} 
    }
    this.saveUserProfile(profile);

    // Also update current user in leaderboard
    this.syncCurrentUserToLeaderboard(profile);
    return profile;
  },

  addXP(amount: number): { profile: UserProfile; leveledUp: boolean; newLevel: number } {
    const profile = this.getUserProfile();
    const oldLevel = profile.level;
    profile.xp += amount;
    const newLevel = getLevelFromXP(profile.xp);
    const leveledUp = newLevel > oldLevel;
    profile.level = newLevel;
    profile.title = getTitleForLevel(newLevel);
    this.saveUserProfile(profile);
    return { profile, leveledUp, newLevel };
  },

  getWrongNotes(): WrongNoteItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.WRONG_NOTES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load wrong notes', e);
    }
    return [];
  },

  addWrongNote(question: Question, wrongAnswerIndex: number): void {
    const notes = this.getWrongNotes();
    const existingIndex = notes.findIndex(n => n.questionId === question.id);
    const newItem: WrongNoteItem = {
      questionId: question.id,
      question,
      wrongAnswerIndex,
      attemptDate: new Date().toLocaleDateString('ko-KR'),
      reviewed: false
    };

    if (existingIndex >= 0) {
      notes[existingIndex] = newItem;
    } else {
      notes.unshift(newItem);
    }

    try {
      localStorage.setItem(STORAGE_KEYS.WRONG_NOTES, JSON.stringify(notes.slice(0, 50)));
    } catch (e) {
      console.error('Failed to save wrong note', e);
    }
  },

  markWrongNoteReviewed(questionId: string): void {
    const notes = this.getWrongNotes();
    const target = notes.find(n => n.questionId === questionId);
    if (target) {
      target.reviewed = true;
      try {
        localStorage.setItem(STORAGE_KEYS.WRONG_NOTES, JSON.stringify(notes));
      } catch (e) {
        console.error('Failed to update wrong note', e);
      }
    }
  },

  clearReviewedWrongNotes(): void {
    const notes = this.getWrongNotes().filter(n => !n.reviewed);
    try {
      localStorage.setItem(STORAGE_KEYS.WRONG_NOTES, JSON.stringify(notes));
    } catch (e) {
      console.error('Failed to clear wrong notes', e);
    }
  },

  // 기기마다 하나씩 만들어지는 고유 번호 (서버에서 '같은 학생'을 구분하는 용도)
  getPlayerId(): string {
    try {
      const p = this.getUserProfile();
      if (p.profileSetupDone && p.studentNumber && isValidClass(p.gradeClass)) {
        return `stu-${GRADE}-${Number(/(\d+)반/.exec(p.gradeClass)?.[1] || 0)}-${p.studentNumber}`;
      }
      let id = localStorage.getItem(STORAGE_KEYS.PLAYER_ID);
      if (!id) {
        id =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
        localStorage.setItem(STORAGE_KEYS.PLAYER_ID, id);
      }
      return id;
    } catch (e) {
      return 'p-local-device';
    }
  },

  markPendingSync(kind: 'played' | 'profile'): void {
    try {
      const current = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
      if (current === 'played' && kind === 'profile') return; // 'played'가 더 우선
      localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, kind);
    } catch (e) {}
  },

  // 서버(구글 시트)와 랭킹을 맞춥니다: 못 올린 내 기록을 올리고, 전체 기록을 내려받습니다.
  // 동기화가 겹치면 기록이 두 번 올라갈 수 있어, 한 번에 하나씩 차례로 실행합니다.
  syncLeaderboardWithServer(): Promise<'ok' | 'error' | 'disabled'> {
    const run = syncQueue.then(() => this.runLeaderboardSync());
    syncQueue = run.catch(() => undefined);
    return run;
  },

  async runLeaderboardSync(): Promise<'ok' | 'error' | 'disabled'> {
    if (!isRemoteEnabled()) return 'disabled';
    const playerId = this.getPlayerId();
    try {
      let pending: string | null = null;
      try {
        pending = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
      } catch (e) {}

      const mine = this.getLeaderboard().find(e => e.isCurrentUser);
      if (pending && mine) {
        let sent = false;
        try {
          const profile = this.getUserProfile();
          if (profile.studentName && profile.studentNumber) {
            sent = await submitRemoteEntry(mine, pending === 'played', profile.studentName, profile.studentNumber);
          }
        } catch (e) {
          sent = false;
        }
        if (sent) {
          pending = null;
          try {
            localStorage.removeItem(STORAGE_KEYS.PENDING_SYNC);
          } catch (e) {}
        }
      }

      const remote = await fetchRemoteLeaderboard();
      let merged: LeaderboardEntry[] = remote.map(e => ({ ...e, isCurrentUser: e.id === playerId }));
      // 아직 서버에 못 올린 내 기록은 화면에서 사라지지 않게 유지
      if (pending && mine) {
        merged = merged.filter(e => !e.isCurrentUser);
        merged.push(mine);
      }
      this.saveLeaderboard(rankEntries(merged));
      return 'ok';
    } catch (e) {
      console.error('Failed to sync leaderboard', e);
      return 'error';
    }
  },

  getLeaderboard(): LeaderboardEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
      if (data) {
        // 예전 버전에 저장된 가짜(봇) 기록은 걸러내고, 실제 플레이 기록만 남깁니다.
        const playerId = this.getPlayerId();
        const real = (JSON.parse(data) as LeaderboardEntry[]).filter(
          e => !String(e.id).startsWith('bot-')
        );
        real.forEach(e => {
          if (e.id === 'current-user') e.id = playerId; // 예전 버전 기록 이어받기
          e.isCurrentUser = e.id === playerId;
          e.schoolName = SCHOOL_NAME;
        });
        rankEntries(real);
        return real;
      }
    } catch (e) {
      console.error('Failed to load leaderboard', e);
    }
    return DEFAULT_LEADERBOARD;
  },

  saveLeaderboard(entries: LeaderboardEntry[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(entries));
    } catch (e) {
      console.error('Failed to save leaderboard', e);
    }
  },

  recordQuizScore(
    score: number,
    accuracy: number,
    maxCombo: number,
    mode: string,
    metrics?: {
      timeTakenSeconds?: number;
      speedPerQuestion?: number;
      escapeFloor?: string;
      escapeRate?: number;
    }
  ): { newRank: number; totalPlayers: number } {
    const profile = this.getUserProfile();
    profile.totalQuizzesTaken += 1;
    if (mode === 'speed' && score > profile.highScoreSpeed) {
      profile.highScoreSpeed = score;
    } else if (mode === 'adaptive' && score > profile.highScoreAdaptive) {
      profile.highScoreAdaptive = score;
    }
    if (metrics?.timeTakenSeconds && (!profile.bestEscapeTime || metrics.timeTakenSeconds < profile.bestEscapeTime)) {
      if (metrics.escapeRate && metrics.escapeRate >= 100) {
        profile.bestEscapeTime = metrics.timeTakenSeconds;
      }
    }
    this.saveUserProfile(profile);

    let entries = this.getLeaderboard();

    // Check if user already exists
    const existingIndex = entries.findIndex(e => e.isCurrentUser);
    const existing = existingIndex >= 0 ? entries[existingIndex] : null;

    // Filter out existing user entry
    entries = entries.filter(e => !e.isCurrentUser);

    const userEntry: LeaderboardEntry = {
      id: this.getPlayerId(),
      rank: 1,
      nickname: profile.nickname,
      schoolName: profile.schoolName,
      gradeClass: profile.gradeClass,
      score: Math.max(score, profile.highScoreSpeed, profile.highScoreAdaptive),
      accuracy,
      maxCombo: Math.max(maxCombo, existing?.maxCombo || 0),
      title: profile.title,
      avatarSeed: 'CurrentUser',
      isCurrentUser: true,
      timestamp: '방금 전',
      timeTakenSeconds: metrics?.timeTakenSeconds ?? existing?.timeTakenSeconds,
      speedPerQuestion: metrics?.speedPerQuestion ?? existing?.speedPerQuestion,
      escapeFloor: metrics?.escapeFloor ?? existing?.escapeFloor ?? 'B15층 (지하 미궁 입구)',
      escapeRate: metrics?.escapeRate ?? existing?.escapeRate ?? 0
    };

    entries.push(userEntry);
    entries.sort((a, b) => b.score - a.score);

    // Re-assign ranks
    entries.forEach((e, idx) => {
      e.rank = idx + 1;
    });

    this.saveLeaderboard(entries);
    this.markPendingSync('played');
    const myRank = entries.find(e => e.isCurrentUser)?.rank || entries.length;
    return { newRank: myRank, totalPlayers: entries.length };
  },

  syncCurrentUserToLeaderboard(profile: UserProfile): void {
    const entries = this.getLeaderboard();
    const currentUser = entries.find(e => e.isCurrentUser);
    if (currentUser) {
      currentUser.nickname = profile.nickname;
      currentUser.schoolName = profile.schoolName;
      currentUser.gradeClass = profile.gradeClass;
      currentUser.title = profile.title;
      this.saveLeaderboard(entries);
      this.markPendingSync('profile');
    }
  },

  markChapterCompleted(chapterId: number): void {
    const profile = this.getUserProfile();
    if (!profile.completedChapters.includes(chapterId)) {
      profile.completedChapters.push(chapterId);
      this.saveUserProfile(profile);
    }
  },

  getQuizHistory(): QuizAttemptRecord[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (data) {
        // 예전 버전에 들어 있던 예시 기록(h-1 ~ h-5)은 제외
        return (JSON.parse(data) as QuizAttemptRecord[]).filter(r => !/^h-\d+$/.test(String(r.id)));
      }
    } catch (e) {
      console.error('Failed to load quiz history', e);
    }
    return DEFAULT_HISTORY;
  },

  addQuizAttempt(record: QuizAttemptRecord): void {
    const history = this.getQuizHistory();
    history.push(record);
    // Keep last 30 sessions
    const trimmed = history.slice(-30);
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(trimmed));
    } catch (e) {
      console.error('Failed to save quiz attempt', e);
    }
  }
};
