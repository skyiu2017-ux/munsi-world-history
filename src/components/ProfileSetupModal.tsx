import React, { useState } from 'react';
import { Compass } from 'lucide-react';
import { SCHOOL_NAME, CLASSES_LIST } from '../data/schoolConfig';

interface ProfileSetupModalProps {
  defaultNickname: string;
  onSubmit: (nickname: string, gradeClass: string) => void;
}

export const ProfileSetupModal: React.FC<ProfileSetupModalProps> = ({ defaultNickname, onSubmit }) => {
  const [nickname, setNickname] = useState<string>(defaultNickname === '세계사탐험가' ? '' : defaultNickname);
  const [gradeClass, setGradeClass] = useState<string>('');

  const canSubmit = nickname.trim().length > 0 && gradeClass !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onSubmit(nickname.trim(), gradeClass);
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
            선택한 학급으로 학급 랭킹에 기록됩니다. 나중에 프로필에서 바꿀 수 있어요.
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
            placeholder="예: 3101 김하늘"
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
