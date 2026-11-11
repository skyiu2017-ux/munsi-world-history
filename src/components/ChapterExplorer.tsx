import React, { useState } from 'react';
import { Chapter, Difficulty } from '../types/history';
import { 
  Landmark, Crown, Shield, Columns, Sword, Castle, 
  Cross, ShieldAlert, Compass, BookOpen, Ship, Flame, 
  Cpu, Globe2, AlertTriangle, Play, ChevronRight,
  CheckCircle2, Calendar, User, Search
} from 'lucide-react';

interface ChapterExplorerProps {
  chapters: Chapter[];
  completedChapterIds: number[];
  onStartQuiz: (chapterId: number, difficulty: Difficulty) => void;
  onStartAdaptive: () => void;
}

export const ChapterExplorer: React.FC<ChapterExplorerProps> = ({
  chapters,
  completedChapterIds,
  onStartQuiz,
  onStartAdaptive
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState<number>(1);
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [selectedEraFilter, setSelectedEraFilter] = useState<string>('all');

  const selectedChapter = chapters.find(c => c.id === selectedChapterId) || chapters[0];

  const eras = [
    { key: 'all', label: `전체 (${chapters.length}개)` },
    { key: 'ancient', label: '고대 문명 & 동양' },
    { key: 'grecoroman', label: '그리스 & 로마' },
    { key: 'medieval', label: '중세 유럽 & 십자군' },
    { key: 'earlymodern', label: '근대 태동 & 절대왕정' },
    { key: 'modern', label: '혁명 & 제국주의' }
  ];

  const getEraGroup = (id: number): string => {
    if (id <= 3) return 'ancient';
    if (id <= 5) return 'grecoroman';
    if (id <= 8) return 'medieval';
    if (id <= 12) return 'earlymodern';
    return 'modern';
  };

  const filteredChapters = chapters.filter(c => {
    const matchesEra = selectedEraFilter === 'all' || getEraGroup(c.id) === selectedEraFilter;
    const matchesSearch = !searchKeyword || 
      c.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      c.concept.keyPoints.some(kp => kp.toLowerCase().includes(searchKeyword.toLowerCase())) ||
      c.concept.keyFigures.some(kf => kf.toLowerCase().includes(searchKeyword.toLowerCase()));
    return matchesEra && matchesSearch;
  });

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Landmark': return <Landmark className="w-5 h-5" />;
      case 'Crown': return <Crown className="w-5 h-5" />;
      case 'Shield': return <Shield className="w-5 h-5" />;
      case 'Columns': return <Columns className="w-5 h-5" />;
      case 'Sword': return <Sword className="w-5 h-5" />;
      case 'Castle': return <Castle className="w-5 h-5" />;
      case 'Cross': return <Cross className="w-5 h-5" />;
      case 'ShieldAlert': return <ShieldAlert className="w-5 h-5" />;
      case 'Compass': return <Compass className="w-5 h-5" />;
      case 'BookOpen': return <BookOpen className="w-5 h-5" />;
      case 'Ship': return <Ship className="w-5 h-5" />;
      case 'Flame': return <Flame className="w-5 h-5" />;
      case 'Cpu': return <Cpu className="w-5 h-5" />;
      case 'Globe2': return <Globe2 className="w-5 h-5" />;
      default: return <Landmark className="w-5 h-5" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Search and Era Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Interactive Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 bg-stone-200/80 dark:bg-stone-800/80 rounded-xl overflow-x-auto text-xs font-medium">
          {eras.map(era => (
            <button
              key={era.key}
              onClick={() => setSelectedEraFilter(era.key)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedEraFilter === era.key
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-sm font-semibold'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
              }`}
            >
              {era.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={e => setSearchKeyword(e.target.value)}
            placeholder="인물, 사건, 개념 키워드 검색..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>
      </div>

      {/* Main Two-Zone Sandbox Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Chapter Navigator List (4 cols) */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400 px-1 pb-1">
            <span>단원 목록 ({filteredChapters.length}개)</span>
            <span>완료: {completedChapterIds.length}/{chapters.length}</span>
          </div>

          {filteredChapters.map(chapter => {
            const isSelected = chapter.id === selectedChapterId;
            const isCompleted = completedChapterIds.includes(chapter.id);

            return (
              <button
                key={chapter.id}
                onClick={() => setSelectedChapterId(chapter.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3.5 ${
                  isSelected
                    ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-600/60 dark:border-amber-500/50 shadow-sm'
                    : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  isSelected
                    ? 'bg-amber-700 text-white shadow-xs'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}>
                  {getIcon(chapter.icon)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-[11px] text-stone-500 dark:text-stone-400 mb-0.5">
                    <span>{String(chapter.id).padStart(2, '0')}. {chapter.era}</span>
                    {isCompleted && (
                      <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> 학습완료
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-stone-900 dark:text-stone-100 truncate">
                    {chapter.title}
                  </h3>

                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate mt-0.5">
                    {chapter.subtitle}
                  </p>
                </div>

                <ChevronRight className={`w-4 h-4 self-center transition-transform ${
                  isSelected ? 'text-amber-700 translate-x-0.5' : 'text-stone-300 dark:text-stone-600'
                }`} />
              </button>
            );
          })}
        </div>

        {/* Right: Detailed Concept Deck & Quiz Launcher (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 sm:p-8 space-y-6">
          {/* Chapter Header */}
          <div className="space-y-2 border-b border-stone-200 dark:border-stone-800 pb-5">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
              <span>제 {selectedChapter.id}장</span>
              <span aria-hidden="true">·</span>
              <span>{selectedChapter.era}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900 dark:text-stone-100">
              {selectedChapter.title}
            </h2>

            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              {selectedChapter.concept.summary}
            </p>
          </div>

          {/* Key Points */}
          <div className="space-y-3">
            <h3 className="text-xs uppercase font-bold tracking-wider text-stone-500 dark:text-stone-400">
              교과서 핵심 출제 포인트
            </h3>
            <ul className="space-y-2.5">
              {selectedChapter.concept.keyPoints.map((point, idx) => (
                <li
                  key={idx}
                  className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-800 text-xs text-stone-800 dark:text-stone-200 leading-relaxed flex items-start gap-2.5"
                >
                  <span className="w-4 h-4 rounded-full bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Exam Pitfall Box */}
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-400">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>선생님이 자주 내는 내신 함정 주의!</span>
            </div>
            <p className="text-xs text-rose-900 dark:text-rose-200 pl-6 leading-relaxed">
              {selectedChapter.concept.examPitfall}
            </p>
          </div>

          {/* Chronology & Key Figures */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Timeline */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300">
                <Calendar className="w-3.5 h-3.5 text-stone-500" />
                <span>주요 사건 연표</span>
              </div>
              <div className="space-y-1.5 text-xs">
                {selectedChapter.concept.chronology.map((item, idx) => (
                  <div key={idx} className="flex items-baseline gap-2 text-stone-600 dark:text-stone-400">
                    <span className="font-mono tabular-nums text-stone-900 dark:text-stone-200 font-semibold shrink-0">
                      {item.year}
                    </span>
                    <span>{item.event}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Figures */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700 dark:text-stone-300">
                <User className="w-3.5 h-3.5 text-stone-500" />
                <span>기억해야 할 역사적 인물</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedChapter.concept.keyFigures.map((fig, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 text-xs rounded-md bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-medium"
                  >
                    {fig}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Quiz Action Launch Deck */}
          <div className="pt-6 border-t border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-xs text-stone-500 dark:text-stone-400">
              개념 복습 완료! 이제 퀴즈로 실력을 확인하세요.
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onStartQuiz(selectedChapter.id, '초급')}
                className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/60 transition-colors"
              >
                초급 퀴즈
              </button>
              <button
                onClick={() => onStartQuiz(selectedChapter.id, '중급')}
                className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-lg bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/60 transition-colors"
              >
                중급 퀴즈
              </button>
              <button
                onClick={() => onStartQuiz(selectedChapter.id, '고급')}
                className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-semibold rounded-lg bg-purple-50 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800/60 transition-colors"
              >
                고급 퀴즈
              </button>
              <button
                onClick={onStartAdaptive}
                className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>적응형 실전</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
