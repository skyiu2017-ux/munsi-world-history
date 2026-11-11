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
  // 모드별로 별개의 순위를 매깁니다. 기존 합산 점수는 기록만 보존합니다.
  entries.sort((a, b) => (a.mode || 'legacy').localeCompare(b.mode || 'legacy') || b.score - a.score);
  const counts: Record<string, number> = {};
  entries.forEach(e => {
    const group = e.mode || 'legacy';
    counts[group] = (counts[group] || 0) + 1;
    e.rank = counts[group];
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

  markPendingSync(kind: 'played' | 'profile', mode?: string): void {
    try {
      // 이전 버전의 'played' 플래그는 분리 전 기록이라 게임을 판별할 수 없습니다.
      const raw = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
      const queue: string[] = raw?.startsWith('[') ? JSON.parse(raw) : [];
      const token = kind === 'played' && (mode === 'adaptive' || mode === 'speed')
        ? 'played:' + mode : 'profile';
      if (!queue.includes(token)) queue.push(token);
      localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(queue));
    } catch (e) {}
  },

  // 서버(구글 시트)와 모드별 최고 기록 동기화. 보내지 못한 기록은 기기에 남겨 둡니다.
  syncLeaderboardWithServer(): Promise<'ok' | 'error' | 'disabled'> {
    const run = syncQueue.then(() => this.runLeaderboardSync());
    syncQueue = run.catch(() => undefined);
    return run;
  },

  async runLeaderboardSync(): Promise<'ok' | 'error' | 'disabled'> {
    if (!isRemoteEnabled()) return 'disabled';
    const playerId = this.getPlayerId();
    try {
      // 옛 서버에는 모드 정보가 없어 두 게임의 점수가 섞일 수 있습니다.
      // 서버 버전부터 확인하고, 오래된 경우 로컬 기록을 보존합니다.
      await fetchRemoteLeaderboard();
      const raw = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC) || '';
      const pending: string[] = raw.startsWith('[') ? JSON.parse(raw) : [];
      const mine = this.getLeaderboard().filter(e => e.isCurrentUser && (e.mode === 'adaptive' || e.mode === 'speed'));
      const remaining: string[] = [];
      for (const token of pending) {
        const modes = token === 'profile' ? ['adaptive', 'speed'] : [token.replace('played:', '')];
        for (const mode of modes) {
          if (mode !== 'adaptive' && mode !== 'speed') continue;
          const entry = mine.find(e => e.mode === mode);
          if (!entry) continue;
          try {
            const profile = this.getUserProfile();
            const ok = Boolean(profile.studentName && profile.studentNumber) &&
              await submitRemoteEntry(entry, token.startsWith('played:'), profile.studentName!, profile.studentNumber!);
            if (!ok && !remaining.includes(token)) remaining.push(token);
          } catch (e) {
            if (!remaining.includes(token)) remaining.push(token);
          }
        }
      }
      if (remaining.length) localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(remaining));
      else localStorage.removeItem(STORAGE_KEYS.PENDING_SYNC);

      const remote = await fetchRemoteLeaderboard();
      let merged: LeaderboardEntry[] = remote
        .filter(e => e.mode === 'adaptive' || e.mode === 'speed')
        .map(e => ({ ...e, isCurrentUser: e.id === playerId }));
      // 오프라인 상태에서 저장된 두 게임의 기록이 사라지지 않도록 보존
      const unsentModes = new Set(remaining.filter(t => t.startsWith('played:')).map(t => t.slice(7)));
      for (const entry of mine) {
        if (unsentModes.has(entry.mode || '')) {
          merged = merged.filter(e => !(e.id === entry.id && e.mode === entry.mode));
          merged.push(entry);
        }
      }
      this.saveLeaderboard(rankEntries(merged));
      return remaining.length ? 'error' : 'ok';
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
          e.mode = e.mode === 'adaptive' || e.mode === 'speed' ? e.mode : 'legacy';
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
    if (mode !== 'adaptive' && mode !== 'speed') {
      return { newRank: 0, totalPlayers: 0 };
    }
    const existing = entries.find(e => e.isCurrentUser && e.mode === mode);
    const newBest = !existing || score > existing.score;
    entries = entries.filter(e => !(e.isCurrentUser && e.mode === mode));
    const userEntry: LeaderboardEntry = {
      id: this.getPlayerId(),
      mode: mode === 'speed' ? 'speed' : 'adaptive',
      rank: 1,
      nickname: profile.nickname,
      schoolName: profile.schoolName,
      gradeClass: profile.gradeClass,
      score: newBest ? score : existing!.score,
      accuracy: newBest ? accuracy : existing!.accuracy,
      maxCombo: Math.max(maxCombo, existing?.maxCombo || 0),
      title: profile.title,
      avatarSeed: 'CurrentUser',
      isCurrentUser: true,
      timestamp: '방금 전',
      timeTakenSeconds: newBest ? metrics?.timeTakenSeconds : existing?.timeTakenSeconds,
      speedPerQuestion: newBest ? metrics?.speedPerQuestion : existing?.speedPerQuestion,
      escapeFloor: newBest ? (metrics?.escapeFloor || '도전 기록') : existing?.escapeFloor,
      escapeRate: newBest ? (metrics?.escapeRate || 0) : existing?.escapeRate
    };
    entries.push(userEntry);
    rankEntries(entries);
    this.saveLeaderboard(entries);
    this.markPendingSync('played', mode);
    const myRank = entries.find(e => e.isCurrentUser && e.mode === mode)?.rank || 0;
    const totalPlayers = entries.filter(e => e.mode === mode).length;
    return { newRank: myRank, totalPlayers };
  },

  syncCurrentUserToLeaderboard(profile: UserProfile): void {
    const entries = this.getLeaderboard();
    const mine = entries.filter(e => e.isCurrentUser);
    if (mine.length) {
      for (const currentUser of mine) {
        currentUser.nickname = profile.nickname;
        currentUser.schoolName = profile.schoolName;
        currentUser.gradeClass = profile.gradeClass;
        currentUser.title = profile.title;
      }
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
