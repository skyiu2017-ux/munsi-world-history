import React from 'react';

interface PixelExplorerProps {
  state?: 'idle' | 'walking' | 'running' | 'cheering' | 'sweating_running' | 'trembling' | 'escaped';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSweat?: boolean;
  isSweating?: boolean;
  className?: string;
}

export const PixelExplorer: React.FC<PixelExplorerProps> = ({
  state = 'idle',
  size = 'md',
  showSweat = false,
  isSweating: isSweatingProp,
  className = ''
}) => {
  const isRunning = state === 'running' || state === 'sweating_running';
  const isSweating = isSweatingProp !== undefined ? isSweatingProp : (showSweat || state === 'sweating_running');

  const sizeDimensions = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32'
  }[size];

  return (
    <div className={`relative inline-flex items-center justify-center select-none ${sizeDimensions} ${className}`}>
      {/* Flying Sweat Droplets when running frantically */}
      {(isSweating || state === 'trembling') && (
        <>
          <span className="absolute -top-1 -right-2 text-sky-400 font-pixel text-xs animate-sweat pointer-events-none">
            💦
          </span>
          <span className="absolute top-1 -right-3 text-sky-300 font-pixel text-[10px] animate-sweat-delayed pointer-events-none">
            💧
          </span>
          <span className="absolute -top-2 right-1 text-cyan-300 font-pixel text-[9px] animate-sweat pointer-events-none">
            💦
          </span>
        </>
      )}

      {/* Speed lines when running */}
      {isRunning && (
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-70">
          <div className="w-3 h-0.5 bg-amber-400/80 rounded" />
          <div className="w-4 h-0.5 bg-white/90 rounded" />
          <div className="w-2 h-0.5 bg-amber-300/80 rounded" />
        </div>
      )}

      {/* Pixel Explorer SVG Character */}
      <svg
        viewBox="0 0 32 32"
        className={`w-full h-full pixelated ${state === 'trembling' ? 'animate-pixel-tremble' : isRunning ? 'animate-pixel-run' : ''}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Shadow */}
        <ellipse cx="16" cy="30" rx="9" ry="2" fill="rgba(0,0,0,0.25)" />

        {/* Brown Explorer Hat / Fedora */}
        {/* Hat Brim */}
        <rect x="7" y="5" width="18" height="2" fill="#78350f" />
        <rect x="6" y="6" width="20" height="1" fill="#92400e" />
        {/* Hat Crown */}
        <rect x="10" y="2" width="12" height="3" fill="#92400e" />
        <rect x="11" y="1" width="10" height="1" fill="#b45309" />
        {/* Hat Ribbon */}
        <rect x="10" y="4" width="12" height="1" fill="#dc2626" />

        {/* Head / Face */}
        <rect x="11" y="7" width="10" height="7" fill="#fed7aa" />
        {/* Hair */}
        <rect x="9" y="7" width="2" height="4" fill="#451a03" />
        <rect x="21" y="7" width="2" height="4" fill="#451a03" />

        {/* Eyes */}
        <rect x="14" y="9" width="1.5" height="2" fill="#1c1917" />
        <rect x="18" y="9" width="1.5" height="2" fill="#1c1917" />
        {/* Eye Shine */}
        <rect x="14" y="9" width="0.8" height="0.8" fill="#ffffff" />
        <rect x="18" y="9" width="0.8" height="0.8" fill="#ffffff" />

        {/* Cheeks / Blush */}
        <rect x="12.5" y="11" width="1.5" height="1" fill="#fca5a5" />
        <rect x="19.5" y="11" width="1.5" height="1" fill="#fca5a5" />

        {/* Mouth (Happy / Determined) */}
        {state === 'trembling' ? (
          <path d="M14 13 Q16 11 18 13" stroke="#991b1b" strokeWidth="1" fill="none" />
        ) : isRunning ? (
          /* Determined / Breathing hard open mouth */
          <rect x="15" y="12" width="3" height="1.5" fill="#991b1b" />
        ) : state === 'cheering' || state === 'escaped' ? (
          /* Big smile */
          <path d="M14 12 Q16 14 18 12" stroke="#991b1b" strokeWidth="1" fill="none" />
        ) : (
          /* Confident smile */
          <rect x="15.5" y="12" width="2.5" height="0.8" fill="#9a3412" />
        )}

        {/* Sweat drop on forehead when sweating */}
        {isSweating && (
          <path d="M12.5 8 C12 8.5 12 9.5 12.5 9.5 C13 9.5 13 8.5 12.5 8 Z" fill="#38bdf8" />
        )}

        {/* Explorer Backpack (Behind body) */}
        <rect x="6" y="14" width="4" height="8" fill="#854d0e" rx="1" />
        <rect x="6" y="16" width="3" height="4" fill="#a16207" />
        {/* Bedroll on top of backpack */}
        <rect x="5" y="12" width="5" height="2" fill="#475569" rx="0.5" />

        {/* Explorer Shirt / Vest (Khaki / Tan) */}
        <rect x="10" y="14" width="12" height="7" fill="#d97706" />
        {/* Vest open lining */}
        <rect x="12" y="14" width="2" height="7" fill="#fef3c7" />
        <rect x="18" y="14" width="2" height="7" fill="#fef3c7" />
        {/* Red Neckerchief / Bandana */}
        <polygon points="15,14 17,14 16,16" fill="#ef4444" />

        {/* Leather Utility Belt with Buckle */}
        <rect x="10" y="21" width="12" height="2" fill="#78350f" />
        <rect x="15" y="21" width="2" height="2" fill="#fbbf24" />

        {/* Arms & Hands */}
        {isRunning ? (
          <>
            {/* Left arm swinging back */}
            <rect x="7" y="16" width="3" height="3" fill="#d97706" />
            <rect x="6" y="18" width="2" height="2" fill="#fed7aa" />
            {/* Right arm swinging forward holding torch */}
            <rect x="22" y="15" width="4" height="3" fill="#d97706" />
            <rect x="25" y="14" width="2" height="2" fill="#fed7aa" />
            {/* Torch handle */}
            <rect x="26" y="11" width="1.5" height="6" fill="#713f12" />
            {/* Torch Flame (Animated flicker) */}
            <polygon points="26,7 28.5,10 24.5,10" fill="#f97316" className="animate-torch" />
            <polygon points="26,8 27.5,10 25.5,10" fill="#fef08a" className="animate-torch" />
          </>
        ) : (
          <>
            {/* Left arm at side */}
            <rect x="8" y="15" width="2" height="5" fill="#d97706" />
            <rect x="8" y="20" width="2" height="2" fill="#fed7aa" />
            {/* Right arm holding torch */}
            <rect x="22" y="15" width="2" height="5" fill="#d97706" />
            <rect x="22" y="18" width="2" height="2" fill="#fed7aa" />
            {/* Torch handle */}
            <rect x="23" y="13" width="1.5" height="7" fill="#713f12" />
            {/* Torch Flame */}
            <polygon points="23.5,8 25.5,12 21.5,12" fill="#f97316" className="animate-torch" />
            <polygon points="23.5,9.5 24.8,12 22.2,12" fill="#fef08a" className="animate-torch" />
          </>
        )}

        {/* Legs / Explorer Pants (Brown/Khaki) */}
        {isRunning ? (
          <>
            {/* Left leg bent back */}
            <rect x="10" y="23" width="3" height="4" fill="#57534e" />
            <rect x="8" y="26" width="3" height="3" fill="#57534e" />
            {/* Right leg stepping forward */}
            <rect x="18" y="23" width="3.5" height="4" fill="#57534e" />
            <rect x="20" y="26" width="3.5" height="3" fill="#57534e" />
            {/* Boots */}
            <rect x="7" y="28" width="3.5" height="2" fill="#292524" />
            <rect x="21" y="28" width="3.5" height="2" fill="#292524" />
          </>
        ) : (
          <>
            <rect x="11" y="23" width="4" height="5" fill="#57534e" />
            <rect x="17" y="23" width="4" height="5" fill="#57534e" />
            {/* Leather Boots */}
            <rect x="10.5" y="27" width="4.5" height="3" fill="#292524" />
            <rect x="17" y="27" width="4.5" height="3" fill="#292524" />
          </>
        )}
      </svg>
    </div>
  );
};

interface DungeonProgressBarProps {
  currentFloor: number; // 1 to 15
  totalFloors?: number;
  mode?: string;
  isEscaped?: boolean;
}

export const DungeonProgressBar: React.FC<DungeonProgressBarProps> = ({
  currentFloor,
  totalFloors = 15,
  mode = '던전 탈출',
  isEscaped = false
}) => {
  const percentage = Math.min(100, Math.round((currentFloor / totalFloors) * 100));

  return (
    <div className="w-full bg-stone-900/90 text-stone-200 border-2 border-stone-700 rounded-2xl p-4 shadow-lg space-y-3 font-pixel">
      {/* Top Floor Badge and Exit Status */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold">DUNGEON DEPTH:</span>
          <span className="px-2 py-0.5 rounded bg-stone-800 border border-stone-600 text-amber-300 font-bold">
            {isEscaped ? '지상 탈출 완료! 🏆' : `B${totalFloors - currentFloor + 1}층 / 총 ${totalFloors}층`}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-stone-400">
          <span>탈출률:</span>
          <span className="font-bold text-emerald-400">{percentage}%</span>
        </div>
      </div>

      {/* Visual Dungeon Corridor with moving Pixel Explorer */}
      <div className="relative h-14 bg-stone-950 rounded-xl border border-stone-800 overflow-hidden flex items-center px-4">
        {/* Stone Dungeon Background Tiles */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:12px_12px]" />

        {/* Floor stone track */}
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-stone-800 border-t border-stone-700" />

        {/* Torch on left entrance */}
        <div className="absolute left-2 top-2 flex flex-col items-center">
          <span className="text-orange-500 text-xs animate-torch">🔥</span>
          <div className="w-1.5 h-3 bg-stone-700 rounded-xs" />
        </div>

        {/* Exit Door with daylight on the far right */}
        <div className="absolute right-2 top-1.5 flex flex-col items-center">
          <div className={`w-8 h-10 border-2 rounded-t-lg flex items-center justify-center transition-all ${
            isEscaped
              ? 'border-amber-400 bg-amber-200/90 shadow-[0_0_15px_#f59e0b]'
              : 'border-stone-600 bg-stone-900/80'
          }`}>
            <span className="text-sm">{isEscaped ? '☀️' : '🚪'}</span>
          </div>
          <span className="text-[9px] text-amber-400 font-bold">EXIT</span>
        </div>

        {/* Explorer progressing from left (deep dungeon) to right (sunlight exit) */}
        <div
          className="absolute transition-all duration-700 ease-out flex items-center"
          style={{
            left: `calc(${Math.min(85, Math.max(8, percentage * 0.85))}% - 16px)`,
            bottom: '4px'
          }}
        >
          <PixelExplorer
            size="md"
            state={isEscaped ? 'escaped' : percentage > 50 ? 'walking' : 'idle'}
          />
        </div>
      </div>

      {/* Progress Message */}
      <div className="text-[11px] text-center text-stone-400">
        {isEscaped ? (
          <span className="text-emerald-400 font-bold">
            🎉 축하합니다! 세계사 지식으로 지하 미궁을 완전히 탈출했습니다!
          </span>
        ) : (
          <span>
            문제를 맞힐 때마다 지상 출구로 한 걸음씩 올라갑니다! (남은 깊이: {totalFloors - currentFloor}층)
          </span>
        )}
      </div>
    </div>
  );
};
