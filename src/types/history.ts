export type Difficulty = '초급' | '중급' | '고급';

export interface ConceptCard {
  title: string;
  summary: string;
  keyPoints: string[];
  examPitfall: string; // 시험에 자주 낚이는 함정 포인트
  keyFigures: string[]; // 중요 인물
  chronology: { year: string; event: string }[];
}

export interface Chapter {
  id: number;
  slug: string;
  title: string;
  era: string; // 예: 고대 문명, 고전 제국, 중세, 근대 태동, 시민 혁명
  subtitle: string;
  icon: string;
  accentColor: string;
  concept: ConceptCard;
}

export interface Question {
  id: string;
  chapterId: number;
  chapterTitle: string;
  difficulty: Difficulty;
  question: string;
  passage?: string; // 사료, 역사적 문서, 설명 지문
  options: string[];
  correctIndex: number;
  explanation: string;
  tip: string;
  tags: string[];
}

export interface QuizSessionConfig {
  mode: 'chapter' | 'adaptive' | 'speed' | 'wrongReview';
  chapterId?: number;
  initialDifficulty?: Difficulty;
  questionCount?: number;
  timeLimit?: number; // seconds
}

export interface WrongNoteItem {
  questionId: string;
  question: Question;
  wrongAnswerIndex: number;
  attemptDate: string;
  reviewed: boolean;
}

export interface LeaderboardEntry {
  id: string;
  mode?: 'adaptive' | 'speed' | 'legacy'; // 서로 다른 퀴즈의 최고 기록 분리
  rank: number;
  nickname: string;
  schoolName: string;
  gradeClass: string; // e.g. "3학년 2반"
  score: number;
  accuracy: number;
  maxCombo: number;
  title: string;
  avatarSeed: string;
  isCurrentUser?: boolean;
  timestamp: string;
  timeTakenSeconds?: number; // 총 풀이 시간 (초)
  speedPerQuestion?: number; // 문항당 평균 풀이 속도 (초)
  escapeFloor?: string; // 던전 탈출 현황 (예: "탈출 성공! (지상)", "B1층(출구 앞)")
  escapeRate?: number; // 탈출 진행률 (0~100%)
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
}

export interface UserProfile {
  nickname: string;
  schoolName: string;
  gradeClass: string; // 미선택이면 빈 문자열
  studentName?: string; // 교사용 확인 정보. 공용 랭킹에는 게시하지 않음
  studentNumber?: number; // 학급 내 출석번호. 동일 학생 식별에 사용
  profileSetupDone?: boolean; // 닉네임·학급 최초 설정 완료 여부
  level: number;
  xp: number;
  title: string;
  totalQuizzesTaken: number;
  totalCorrect: number;
  highScoreSpeed: number;
  highScoreAdaptive: number;
  completedChapters: number[];
  achievements: Achievement[];
  bestEscapeTime?: number; // 최고 탈출 기록 시간 (초)
}

export interface QuizAttemptRecord {
  id: string;
  date: string;
  timeLabel: string;
  score: number;
  accuracy: number;
  maxCombo: number;
  mode: string;
  timeTakenSeconds?: number;
  speedPerQuestion?: number;
  escapeFloor?: string;
}
