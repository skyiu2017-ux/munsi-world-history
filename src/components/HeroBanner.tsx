import React from 'react';
import { Sparkles, Zap, Award, Flame, ChevronRight, BookOpen } from 'lucide-react';
import worldHistoryHero from '../assets/images/world_history_hero_1793522559512.jpg';

interface HeroBannerProps {
  onStartAdaptive: () => void;
  onStartSpeed: () => void;
  onExploreChapters: () => void;
  onOpenDailyQuiz?: () => void;
  totalChaptersCount: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onStartAdaptive,
  onStartSpeed,
  onExploreChapters,
  onOpenDailyQuiz,
  totalChaptersCount
}) => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/60 to-transparent dark:from-stone-900/60 dark:to-transparent border-b border-stone-200 dark:border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-400">
              <span className="uppercase tracking-wider">중학교 3학년 역사① 교과 연계</span>
              <span aria-hidden="true">·</span>
              <span>15개 핵심 시대 (절대 왕정 수록)</span>
              {onOpenDailyQuiz && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    onClick={onOpenDailyQuiz}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 hover:bg-amber-300 transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-amber-700 dark:text-amber-300" />
                    <span>오늘의 키워드 퀴즈 도전 (+50 XP)</span>
                  </button>
                </>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-950 dark:text-white tracking-tight leading-[1.2] text-balance">
              역사를 꿰뚫는 지혜,<br />
              <span className="text-amber-800 dark:text-amber-500">세계사 마스터 퀴즈 & 랭킹 배틀</span>
            </h1>

            <p className="text-stone-600 dark:text-stone-300 text-base sm:text-lg leading-relaxed max-w-2xl">
              4대 문명의 탄생부터 페르시아, 진·한, 그리스·로마, 중세 봉건제, 교황권과 십자군, 르네상스, 종교개혁, 신항로 개척, 프랑스 혁명, 산업 혁명, 제국주의까지!
              지하 미궁에 갇힌 역사 탐험가가 되어 문제를 풀고 지상으로 탈출하세요. 적응형 퀴즈와 60초 스피드 탈출 랭킹으로 친구들과 실시간 경쟁할 수 있습니다.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={onStartAdaptive}
                className="px-5 py-3 text-sm font-semibold rounded-xl bg-amber-700 hover:bg-amber-800 dark:bg-amber-600 dark:hover:bg-amber-500 text-white shadow-sm hover:shadow transition-all flex items-center gap-2 group whitespace-nowrap"
              >
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>적응형 레벨업 퀴즈</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={onStartSpeed}
                className="px-5 py-3 text-sm font-semibold rounded-xl bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 hover:from-black hover:to-amber-900 text-white shadow-sm transition-all flex items-center gap-2 whitespace-nowrap border border-amber-700/40"
              >
                <Flame className="w-4 h-4 text-orange-400" />
                <span>🏃‍♂️ 60초 미궁 탈출 스피드전</span>
              </button>

              <button
                onClick={onExploreChapters}
                className="px-4 py-3 text-sm font-medium rounded-xl text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/80 border border-stone-200 dark:border-stone-700 transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4 text-stone-500" />
                <span>시대별 개념 카드 보기</span>
              </button>
            </div>
          </div>

          {/* Right Column: Hero Visual Artwork */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-stone-300 dark:border-stone-700 shadow-md aspect-[16/10] bg-stone-200 dark:bg-stone-800">
              <img
                src={worldHistoryHero}
                alt="세계사 역사 파노라마 삽화: 4대 문명, 로마 콜로세움, 중세 성곽, 대항해시대 범선, 산업혁명 기차"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/70 via-stone-950/20 to-transparent flex items-end p-5">
                <div className="text-white space-y-1">
                  <div className="text-xs uppercase tracking-wider font-semibold text-amber-300">
                    Chronicle of World Civilizations
                  </div>
                  <div className="text-sm font-medium text-stone-200">
                    인류의 기원에서 근대 제국주의까지 이어지는 지식의 대서사시
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Column Feature Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-stone-200 dark:border-stone-800 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-stone-900 dark:text-stone-100">15개 전 단원 망라</div>
              <div className="text-stone-500 dark:text-stone-400">교과서 핵심 개념 완벽 요약</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-stone-900 dark:text-stone-100">동적 적응형 난이도</div>
              <div className="text-stone-500 dark:text-stone-400">초급 · 중급 · 고급 실시간 전환</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-400 flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-stone-900 dark:text-stone-100">미궁 탈출 챌린지</div>
              <div className="text-stone-500 dark:text-stone-400">매번 다른 문제 완전 랜덤 출제</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-400 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-stone-900 dark:text-stone-100">각 학급 랭킹 대항전</div>
              <div className="text-stone-500 dark:text-stone-400">반별 평균 점수 & 실시간 순위</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
