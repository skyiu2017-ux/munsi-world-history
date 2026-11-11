import React, { useState } from 'react';
import { Compass } from 'lucide-react';
import { SCHOOL_NAME, CLASSES_LIST } from '../data/schoolConfig';

interface ProfileSetupModalProps {
  defaultNickname: string;
  onSubmit: (nickname: string, gradeClass: string, studentName: string, studentNumber: number) => void;
}

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({ defaultNickname, onSubmit }) => {
  const [nickname, setNickname] = useState<string>(defaultNickname === '세계사탐험가' ? '' : defaultNickname);
  const [gradeClass, setGradeClass] = useState<string>('');
  const [studentName, setStudentName] = useState('');
  const [numberText, setNumberText] = useState('');
  const studentNumber = Number(numberText);
  const canSubmit = nickname.trim().length > 0 && gradeClass !== '' && studentName.trim().length >= 2 &&
    /^\d{1,2}$/.test(numberText) && studentNumber >= 1 && studentNumber <= 45;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(nickname.trim(), gradeClass, studentName.trim(), studentNumber);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xl max-w-md w-full p-6 space-y-5"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
            <Compass className="w-4 h-4" />
            <span>{SCHOOL_NAME} 3학년 세계사</span>
          </div>
          <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">탐험가 정보를 입력해주세요</h2>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            학년·반·번호로 중복 기록을 방지합니다. 이름은 교사 확인용으로만 보관되며 공개 랭킹에는 닉네임만 표시됩니다.
          </p>
        </div>

        <div>
          <label className="text-[11px] text-stone-500 block mb-1">학교</label>
          <div className="w-full px-3 py-2 text-sm rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
            {SCHOOL_NAME}
          </div>
        </div>

        <div>
          <label className="text-[11px] text-stone-500 block mb-1">닉네임</label>
          <input
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            maxLength={12}
            placeholder="예: 시간여행자"
            className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-600 text-stone-900 dark:text-stone-100"
            required
          />
        </div>

        <div>
          <label className="text-[11px] text-stone-500 block mb-1.5">학급 (3학년)</label>
          <div className="grid grid-cols-5 gap-1.5">
            {CLASSES_LIST.map((cls, i) => (
              <button
                key={cls}
                type="button"
                onClick={() => setGradeClass(cls)}
                className={`py-2 rounded-lg text-xs font-semibold border transition-colors ${
                  gradeClass === cls
                    ? 'bg-amber-700 text-white border-amber-700'
                    : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-amber-100 dark:hover:bg-amber-950/40'
                }`}
              >
                {i + 1}반
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_90px] gap-3">
          <div>
            <label className="text-xs text-stone-600 dark:text-stone-300 block mb-1">실제 이름 (교사용 · 공개 안 됨)</label>
            <input type="text" value={studentName} onChange={e => setStudentName(e.target.value)}
              maxLength={20} autoComplete="name" placeholder="실제 이름"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-white" required />
          </div>
          <div>
            <label className="text-xs text-stone-600 dark:text-stone-300 block mb-1">출석번호</label>
            <input type="number" inputMode="numeric" value={numberText} min={1} max={45}
              onChange={e => setNumberText(e.target.value)} placeholder="예: 17"
              className="w-full px-3 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-900 text-stone-900 dark:text-white" required />
          </div>
        </div>
        <p className="text-[11px] text-stone-500 dark:text-stone-400">같은 반·번호로 다른 이름을 등록하면 서버에서 거절합니다. 다른 사람이 대신 입력할 수 있으므로 공식 시험용 인증을 대체하지는 않습니다.</p>
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-2.5 rounded-xl text-sm font-bold bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          시작하기
        </button>
      </form>
    </div>
  );
};
