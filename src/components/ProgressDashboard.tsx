import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  CartesianGrid, Legend, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar 
} from 'recharts';
import { UserProfile, Chapter, WrongNoteItem, QuizAttemptRecord } from '../types/history';
import { 
  TrendingUp, Award, CheckCircle2, BookOpen, 
  Target, Zap, Flame, ArrowUpRight, BarChart3, Compass
} from 'lucide-react';

interface ProgressDashboardProps {
  userProfile: UserProfile;
  chapters: Chapter[];
  wrongNotes: WrongNoteItem[];
  historyRecords: QuizAttemptRecord[];
  onSelectChapter: (chapterId: number) => void;
  onStartAdaptive: () => void;
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({
  userProfile,
  chapters,
  wrongNotes,
  historyRecords,
  onSelectChapter,
  onStartAdaptive
}) => {
  const totalChaptersCount = chapters.length;

  // 1. Calculate accuracy & trend line data
  const trendData = historyRecords.map((rec, idx) => ({
    session: rec.timeLabel || `${idx + 1}회차`,
    accuracy: rec.accuracy,
    score: rec.score,
    maxCombo: rec.maxCombo,
    mode: rec.mode
  }));

  // Average accuracy
  const avgAccuracy = trendData.length > 0
    ? Math.round(trendData.reduce((acc, curr) => acc + curr.accuracy, 0) / trendData.length)
    : 0;

  // 2. Calculate Radar Competency data across 5 Historical Eras
  const eraGroups = [
    { key: 'ancient', label: '고대 문명 & 동양', chapterIds: [1, 2, 3] },
    { key: 'grecoroman', label: '그리스 & 로마', chapterIds: [4, 5] },
    { key: 'medieval', label: '중세 유럽 & 십자군', chapterIds: [6, 7, 8] },
    { key: 'earlymodern', label: '근대 태동 & 절대왕정', chapterIds: [9, 10, 11, 12] },
    { key: 'modern', label: '시민 혁명 & 제국주의', chapterIds: [13, 14, 15] }
  ];

  const radarData = eraGroups.map(group => {
    // Check how many chapters completed in this era
    const completedCount = group.chapterIds.filter(id => 
      userProfile.completedChapters.includes(id)
    ).length;
    const completionRate = Math.round((completedCount / group.chapterIds.length) * 100);

    // Check wrong notes count in this era
    const eraWrongCount = wrongNotes.filter(n => group.chapterIds.includes(n.question.chapterId)).length;
    // Calculate estimated mastery
    let mastery = Math.max(20, Math.min(100, (completionRate * 0.7) + (userProfile.level * 4) - (eraWrongCount * 5)));
    if (completedCount === group.chapterIds.length && eraWrongCount === 0) {
      mastery = 95;
    }

    return {
      era: group.label,
      숙련도: Math.max(30, mastery)
    };
  });

  // Calculate mastered chapters (chapters in completedChapters and no active wrong notes)
  const isChapterMastered = (chId: number) => {
    const isCompleted = userProfile.completedChapters.includes(chId);
    const hasUnresolvedErrors = wrongNotes.some(n => n.question.chapterId === chId && !n.reviewed);
    return isCompleted && !hasUnresolvedErrors;
  };

  const masteredCount = chapters.filter(c => isChapterMastered(c.id)).length;

  // Custom LineChart Tooltip
  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-lg text-xs space-y-1">
          <div className="font-bold text-stone-900 dark:text-stone-100">{label} 기록</div>
          <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
            정답률: {payload[0]?.value}%
          </div>
          <div className="text-amber-600 dark:text-amber-400 font-semibold">
            점수: {payload[1]?.value?.toLocaleString()}점
          </div>
          {payload[0]?.payload?.mode && (
            <div className="text-[10px] text-stone-400">
              유형: {payload[0].payload.mode}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>학습 진도 & 역량 분석 대시보드</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
            나의 세계사 마스터 진도율
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1">
            퀴즈 정답률 변화 추이, 시대별 역량 분포(레이더 차트), 단원별 정복 현황을 한눈에 파악하세요.
          </p>
        </div>

        <button
          onClick={onStartAdaptive}
          className="px-4 py-2.5 text-xs font-bold rounded-xl bg-amber-700 hover:bg-amber-800 text-white shadow-xs transition-colors flex items-center gap-1.5"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>적응형 실력 점검 퀴즈</span>
        </button>
      </div>

      {/* KPI 4-Card Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>마스터 완료 단원</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-stone-900 dark:text-stone-100">
            {masteredCount} <span className="text-xs font-normal text-stone-400">/ {totalChaptersCount}개</span>
          </div>
          <div className="text-[11px] text-stone-500">
            전체 단원의 {totalChaptersCount > 0 ? Math.round((masteredCount / totalChaptersCount) * 100) : 0}% 정복
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>평균 정답률</span>
            <Target className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {avgAccuracy}%
          </div>
          <div className="text-[11px] text-stone-500">
            최근 {trendData.length}회 학습 세션 기준
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>최고 연속 정답</span>
            <Flame className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-orange-600 dark:text-orange-400">
            {Math.max(0, ...trendData.map(d => d.maxCombo || 0))}회
          </div>
          <div className="text-[11px] text-stone-500">
            무오답 연속 연승 기록
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-stone-400 text-xs">
            <span>누적 경험치 & 레벨</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black font-mono tabular-nums text-purple-700 dark:text-purple-400">
            Lv.{userProfile.level} <span className="text-xs font-normal text-stone-400">({userProfile.xp} XP)</span>
          </div>
          <div className="text-[11px] text-stone-500">
            {userProfile.title}
          </div>
        </div>
      </div>

      {/* Main Charts Two-Zone Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Performance Trends Line Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>회차별 퀴즈 정답률 & 점수 추이</span>
              </h3>
              <p className="text-[11px] text-stone-400">
                내가 실제로 푼 퀴즈의 회차별 정답률과 점수입니다.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 text-emerald-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>정답률 (%)</span>
              </div>
              <div className="flex items-center gap-1 text-amber-600 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>점수 (점)</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full pt-2 relative">
            {trendData.length === 0 && (
              <div className="absolute inset-0 z-10 flex items-center justify-center text-xs text-stone-400">
                아직 응시 기록이 없습니다. 퀴즈를 풀면 여기에 추이가 표시됩니다.
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis 
                  dataKey="session" 
                  tick={{ fontSize: 11, fill: '#888' }} 
                  axisLine={{ stroke: '#ccc', opacity: 0.3 }}
                />
                <YAxis 
                  yAxisId="left" 
                  domain={[0, 100]} 
                  tick={{ fontSize: 11, fill: '#888' }} 
                  axisLine={{ stroke: '#ccc', opacity: 0.3 }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right" 
                  tick={{ fontSize: 11, fill: '#888' }} 
                  axisLine={{ stroke: '#ccc', opacity: 0.3 }}
                />
                <Tooltip content={<CustomLineTooltip />} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="accuracy"
                  name="정답률"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981' }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="score"
                  name="점수"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#f59e0b' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Subject / Era Distribution Radar Chart (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-xs space-y-4">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-purple-600" />
              <span>시대별 역량 분포 레이더</span>
            </h3>
            <p className="text-[11px] text-stone-400">
              5대 시대별 균형 잡힌 개념 숙련도를 시각화합니다.
            </p>
          </div>

          <div className="h-72 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid strokeOpacity={0.2} />
                <PolarAngleAxis 
                  dataKey="era" 
                  tick={{ fontSize: 10, fill: '#666' }} 
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]} 
                  tick={{ fontSize: 9, fill: '#999' }} 
                />
                <Radar
                  name="내 숙련도"
                  dataKey="숙련도"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.4}
                />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Mastered Chapters Progress Grid (14 Chapters) */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              {totalChaptersCount}개 전 단원 정복 현황
            </h3>
            <p className="text-xs text-stone-400">
              단원을 클릭하면 해당 단원의 핵심 개념 카드로 바로 이동합니다.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> 마스터 ({masteredCount})
            </span>
            <span className="flex items-center gap-1 text-amber-600 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> 학습 중 ({userProfile.completedChapters.length - masteredCount})
            </span>
            <span className="flex items-center gap-1 text-stone-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-stone-300 dark:bg-stone-700" /> 미도전 ({Math.max(0, totalChaptersCount - userProfile.completedChapters.length)})
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
          {chapters.map(chapter => {
            const isCompleted = userProfile.completedChapters.includes(chapter.id);
            const mastered = isChapterMastered(chapter.id);

            return (
              <button
                key={chapter.id}
                onClick={() => onSelectChapter(chapter.id)}
                className={`p-3.5 rounded-xl border text-left transition-all group flex items-start justify-between gap-2 ${
                  mastered
                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400'
                    : isCompleted
                    ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/60 hover:border-amber-400'
                    : 'bg-stone-50/50 dark:bg-stone-800/30 border-stone-200 dark:border-stone-800 hover:border-stone-300'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] text-stone-400 mb-0.5">
                    <span>{String(chapter.id).padStart(2, '0')}장</span>
                    <span>·</span>
                    <span className="truncate">{chapter.era}</span>
                  </div>
                  <h4 className="font-bold text-xs text-stone-900 dark:text-stone-100 truncate group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                    {chapter.title}
                  </h4>
                </div>

                <div className="shrink-0 mt-0.5">
                  {mastered ? (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </span>
                  ) : isCompleted ? (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-[10px] font-bold">
                      진행
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-400 text-[10px]">
                      -
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
