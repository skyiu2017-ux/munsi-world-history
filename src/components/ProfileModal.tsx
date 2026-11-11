import React, { useState } from 'react';
import { UserProfile } from '../types/history';
import ancientRomeRelic from '../assets/images/ancient_rome_relic_1793522561048.jpg';
import renaissanceAstrolabe from '../assets/images/renaissance_astrolabe_1793522561308.jpg';
import { SCHOOL_NAME, CLASSES_LIST } from '../data/schoolConfig';
import { 
  X, Award, Trophy, Zap, Flame, Shield, CheckCircle2, 
  Sparkles, Star, Edit2, Check, BookOpen
} from 'lucide-react';

interface ProfileModalProps {
  userProfile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProfile: (nickname: string, schoolName: string, gradeClass: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  userProfile,
  isOpen,
  onClose,
  onUpdateProfile
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(userProfile.nickname);
  const schoolName = SCHOOL_NAME;
  const [gradeClass, setGradeClass] = useState(userProfile.gradeClass || CLASSES_LIST[0]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(nickname, schoolName, gradeClass);
    setIsEditing(false);
  };

  const nextLevelXP = userProfile.level * 120;
  const currentLevelBaseXP = (userProfile.level - 1) * 120;
  const levelProgress = Math.min(100, Math.max(0, Math.round(
    ((userProfile.xp - currentLevelBaseXP) / (nextLevelXP - currentLevelBaseXP)) * 100
  )));

  const unlockedCount = userProfile.achievements.filter(a => a.unlocked).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100">
              내 역사 학습 프로필 & 업적
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* User Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 to-stone-100 dark:from-stone-800 dark:to-stone-800/60 border border-stone-200 dark:border-stone-700/80 flex flex-col sm:flex-row items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-700 text-white flex items-center justify-center text-2xl font-black shadow-sm shrink-0">
              {userProfile.level}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                  {userProfile.nickname}
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 text-xs font-semibold">
                  {userProfile.title}
                </span>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 ml-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-xs text-stone-500 dark:text-stone-400">
                {SCHOOL_NAME} · {userProfile.gradeClass || '학급 미선택'}
              </div>

              {/* XP Progress Bar */}
              <div className="pt-2">
                <div className="flex justify-between text-[11px] text-stone-500 mb-1">
                  <span>경험치 (XP): {userProfile.xp}</span>
                  <span>다음 레벨까지: {nextLevelXP - userProfile.xp} XP</span>
                </div>
                <div className="w-full h-2 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden">
                  <div
                    className="h-full bg-amber-600 transition-all duration-500 rounded-full"
                    style={{ width: `${levelProgress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          {isEditing && (
            <form onSubmit={handleSave} className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-stone-500 block mb-1">닉네임</label>
                  <input
                    type="text"
                    value={nickname}
                    onChange={e => setNickname(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-stone-500 block mb-1">학교명</label>
                  <input
                    type="text"
                    value={schoolName}
                    readOnly
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-stone-500 block mb-1">학년 / 반</label>
                  <select
                    value={gradeClass}
                    onChange={e => setGradeClass(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                    required
                  >
                    {CLASSES_LIST.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 text-xs rounded-lg text-stone-500 hover:bg-stone-200"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 text-xs font-semibold rounded-lg bg-amber-700 text-white"
                >
                  저장
                </button>
              </div>
            </form>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800">
              <span className="text-stone-400 block mb-1">완료한 단원</span>
              <span className="font-mono font-bold text-base text-stone-900 dark:text-stone-100">
                {userProfile.completedChapters.length} / 15
              </span>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800">
              <span className="text-stone-400 block mb-1">스피드 최고점</span>
              <span className="font-mono font-bold text-base text-amber-700 dark:text-amber-400">
                {userProfile.highScoreSpeed.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800">
              <span className="text-stone-400 block mb-1">적응형 최고점</span>
              <span className="font-mono font-bold text-base text-purple-700 dark:text-purple-400">
                {userProfile.highScoreAdaptive.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800">
              <span className="text-stone-400 block mb-1">달성 업적</span>
              <span className="font-mono font-bold text-base text-emerald-700 dark:text-emerald-400">
                {unlockedCount} / {userProfile.achievements.length}
              </span>
            </div>
          </div>

          {/* Historic Relic Showcase Banner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 h-32 flex items-center p-4">
              <img
                src={ancientRomeRelic}
                alt="로마 황금 월계관과 양피지 문서 유물"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover opacity-85"
              />
              <div className="relative z-10 bg-black/60 backdrop-blur-xs p-2.5 rounded-xl text-white">
                <div className="text-[10px] text-amber-300 font-bold uppercase">고대 명예 유물</div>
                <div className="text-xs font-semibold">로마 황금 월계관 & 양피지</div>
              </div>
            </div>

            <div className="relative rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-800 h-32 flex items-center p-4">
              <img
                src={renaissanceAstrolabe}
                alt="르네상스 천문 관측기 아스트롤라베와 나침반 유물"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover opacity-85"
              />
              <div className="relative z-10 bg-black/60 backdrop-blur-xs p-2.5 rounded-xl text-white">
                <div className="text-[10px] text-amber-300 font-bold uppercase">대항해시대 유물</div>
                <div className="text-xs font-semibold">황동 아스트롤라베 & 고지도</div>
              </div>
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold tracking-wider text-stone-500">
              도전 과제 & 업적 배지 ({unlockedCount}/{userProfile.achievements.length})
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {userProfile.achievements.map(ach => (
                <div
                  key={ach.id}
                  className={`p-3.5 rounded-xl border transition-all flex items-start gap-3 ${
                    ach.unlocked
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                      : 'bg-stone-50/50 dark:bg-stone-800/30 border-stone-200 dark:border-stone-800 opacity-60'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    ach.unlocked
                      ? 'bg-amber-600 text-white'
                      : 'bg-stone-200 dark:bg-stone-700 text-stone-400'
                  }`}>
                    {ach.unlocked ? <CheckCircle2 className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-xs text-stone-900 dark:text-stone-100 flex items-center justify-between">
                      <span className="truncate">{ach.title}</span>
                      {ach.unlocked && (
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold">
                          달성
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5 leading-snug">
                      {ach.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
