import { LeaderboardEntry } from '../types/history';
import { SHEETS_API_URL, SCHOOL_NAME } from '../data/schoolConfig';

const API_URL = SHEETS_API_URL.trim();

export const isRemoteEnabled = (): boolean => /^https:\/\/script\.google\.com\/.+\/exec$/.test(API_URL);

const withTimeout = (ms: number): AbortSignal | undefined => {
  try {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  } catch {
    return undefined;
  }
};

// 서버(시트)에 쌓인 실제 플레이 기록 전체를 가져옵니다.
export async function fetchRemoteLeaderboard(): Promise<LeaderboardEntry[]> {
  const res = await fetch(`${API_URL}?t=${Date.now()}`, { redirect: 'follow', signal: withTimeout(15000) });
  const data = await res.json();
  if (!data?.ok || !Array.isArray(data.entries)) throw new Error(data?.error || 'bad response');
  if (data.version !== 2) throw new Error('Google Apps Script를 새 Code.gs 버전으로 다시 배포해야 합니다.');

  return data.entries.map((e: any): LeaderboardEntry => ({
    id: String(e.id),
    mode: e.mode === 'adaptive' || e.mode === 'speed' ? e.mode : 'legacy',
    rank: 0,
    nickname: String(e.nickname ?? ''),
    schoolName: SCHOOL_NAME,
    gradeClass: String(e.gradeClass ?? ''),
    score: Number(e.score) || 0,
    accuracy: Number(e.accuracy) || 0,
    maxCombo: Number(e.maxCombo) || 0,
    title: String(e.title ?? ''),
    avatarSeed: String(e.id),
    timestamp: String(e.updatedAt ?? ''),
    timeTakenSeconds: e.timeTakenSeconds == null ? undefined : Number(e.timeTakenSeconds),
    speedPerQuestion: e.speedPerQuestion == null ? undefined : Number(e.speedPerQuestion),
    escapeFloor: e.escapeFloor ? String(e.escapeFloor) : undefined,
    escapeRate: Number(e.escapeRate) || 0
  }));
}

// 내 기록 한 줄을 서버에 올립니다. played=true 일 때만 플레이 횟수가 올라가고 새 줄이 만들어집니다.
export async function submitRemoteEntry(entry: LeaderboardEntry, played: boolean, studentName: string, studentNumber: number): Promise<boolean> {
  const res = await fetch(API_URL, {
    method: 'POST',
    redirect: 'follow',
    // text/plain 으로 보내야 브라우저 사전 요청(preflight) 없이 Apps Script가 받습니다.
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      id: entry.id,
      mode: entry.mode === 'speed' ? 'speed' : 'adaptive',
      nickname: entry.nickname,
      gradeClass: entry.gradeClass,
      studentName,
      studentNumber,
      score: entry.score,
      accuracy: entry.accuracy,
      maxCombo: entry.maxCombo,
      title: entry.title,
      timeTakenSeconds: entry.timeTakenSeconds ?? null,
      speedPerQuestion: entry.speedPerQuestion ?? null,
      escapeFloor: entry.escapeFloor ?? '',
      escapeRate: entry.escapeRate ?? 0,
      played
    }),
    signal: withTimeout(15000)
  });
  const data = await res.json();
  return data?.ok === true;
}
