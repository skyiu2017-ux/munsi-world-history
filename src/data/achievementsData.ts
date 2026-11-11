import { Achievement } from '../types/history';

export const INITIAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-step',
    title: '역사의 첫 걸음',
    description: '첫 번째 세계사 퀴즈를 완료하세요.',
    icon: 'Sparkles',
    unlocked: false,
    progress: 0,
    maxProgress: 1
  },
  {
    id: 'combo-5',
    title: '연속 정답 콤보 5',
    description: '퀴즈 중 5연속 정답을 달성하세요.',
    icon: 'Zap',
    unlocked: false,
    progress: 0,
    maxProgress: 5
  },
  {
    id: 'combo-10',
    title: '불타는 연승 10',
    description: '퀴즈 중 10연속 무오답 행진을 기록하세요.',
    icon: 'Flame',
    unlocked: false,
    progress: 0,
    maxProgress: 10
  },
  {
    id: 'ancient-master',
    title: '문명의 개척자',
    description: '4대 문명 & 페르시아 제국 퀴즈를 모두 완료하세요.',
    icon: 'Pyramid',
    unlocked: false,
    progress: 0,
    maxProgress: 2
  },
  {
    id: 'greco-roman',
    title: '지중해의 지배자',
    description: '그리스·헬레니즘과 로마 제국 퀴즈를 정복하세요.',
    icon: 'Columns',
    unlocked: false,
    progress: 0,
    maxProgress: 2
  },
  {
    id: 'medieval-knight',
    title: '중세의 수호 기사',
    description: '중세 유럽 봉건제, 교황권, 십자군 단원을 학습하세요.',
    icon: 'Shield',
    unlocked: false,
    progress: 0,
    maxProgress: 3
  },
  {
    id: 'renaissance-genius',
    title: '르네상스 만능인',
    description: '르네상스와 종교개혁 단원을 클리어하세요.',
    icon: 'Compass',
    unlocked: false,
    progress: 0,
    maxProgress: 2
  },
  {
    id: 'modern-revolution',
    title: '근대 시민 혁명가',
    description: '신항로 개척, 프랑스 혁명, 산업 혁명 단원을 클리어하세요.',
    icon: 'Flag',
    unlocked: false,
    progress: 0,
    maxProgress: 3
  },
  {
    id: 'speed-king',
    title: '스피드 챌린지 1000점',
    description: '60초 스피드 챌린지에서 1000점 이상을 획득하세요.',
    icon: 'Timer',
    unlocked: false,
    progress: 0,
    maxProgress: 1000
  },
  {
    id: 'error-slayer',
    title: '오답 정복 클리닉',
    description: '오답노트에서 틀린 문제 3개를 복습하세요.',
    icon: 'CheckCheck',
    unlocked: false,
    progress: 0,
    maxProgress: 3
  },
  {
    id: 'world-historian',
    title: '세계사 원로원 의원',
    description: '15개 모든 단원의 학습을 1회 이상 완료하세요.',
    icon: 'Crown',
    unlocked: false,
    progress: 0,
    maxProgress: 15
  },
  {
    id: 'adaptive-scholar',
    title: '고급 난이도 마스터',
    description: '적응형 퀴즈에서 최고 난이도인 고급 문제를 맞히세요.',
    icon: 'Award',
    unlocked: false,
    progress: 0,
    maxProgress: 1
  }
];
