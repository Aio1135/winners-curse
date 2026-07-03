import type { StageDef } from '../engine/types';

// ⚠️ 밸런싱 수치(예산·목표치·가치 범위·코인)는 전부 임의값 — 실플레이로 사람이 조정한다.
// 커리큘럼(CLAUDE.md §7)과 1:1 대응.
export const STAGES: StageDef[] = [
  {
    id: 1,
    title: '첫 망치소리',
    auctionType: 'english',
    rounds: 3,
    budget: 3000,
    coins: 2,
    sigma: 0.1, // 거의 정확한 감정
    valueRange: { min: 400, max: 1600 },
    targetValue: 1200,
    bidders: [
      { kind: 'honest', id: 'honest-1', name: '감정사 A' },
      { kind: 'honest', id: 'honest-2', name: '감정사 B' },
    ],
  },
  {
    id: 2,
    title: '봉투 속 숫자',
    auctionType: 'sealed-first',
    rounds: 4,
    budget: 3000,
    coins: 2,
    sigma: 0.2,
    valueRange: { min: 400, max: 1600 },
    targetValue: 1500,
    bidders: [
      { kind: 'honest', id: 'honest-1' },
      { kind: 'miser', id: 'miser-1', preferredCategory: 'antique' },
    ],
  },
  {
    id: 3,
    title: '정직의 역설',
    auctionType: 'sealed-second',
    rounds: 4,
    budget: 3000,
    coins: 2,
    sigma: 0.3,
    valueRange: { min: 400, max: 1600 },
    targetValue: 1500,
    bidders: [
      { kind: 'honest', id: 'honest-1' },
      { kind: 'bulldozer', id: 'bulldozer-1', preferredCategory: 'art' },
    ],
  },
  {
    id: 4,
    title: '내려가는 시계',
    auctionType: 'dutch',
    rounds: 4,
    budget: 3000,
    coins: 2,
    sigma: 0.3,
    valueRange: { min: 400, max: 1600 },
    targetValue: 1500,
    bidders: [
      { kind: 'honest', id: 'honest-1' },
      { kind: 'sniper', id: 'sniper-1', preferredCategory: 'timepiece' },
    ],
  },
  {
    id: 5,
    title: '승자의 저주',
    auctionType: 'sealed-first',
    rounds: 5,
    budget: 3500,
    coins: 2,
    sigma: 0.4, // 감정이 크게 흔들린다 — 감정 의뢰가 중요
    valueRange: { min: 400, max: 1600 },
    targetValue: 1800,
    bidders: [
      { kind: 'bulldozer', id: 'bulldozer-1', name: '불도저 A' },
      { kind: 'bulldozer', id: 'bulldozer-2', name: '불도저 B', preferredCategory: 'collectible' },
    ],
  },
  {
    id: 6,
    title: '짬짜미',
    auctionType: 'english',
    rounds: 5,
    budget: 3500,
    coins: 2,
    sigma: 0.3,
    valueRange: { min: 400, max: 1600 },
    targetValue: 1800,
    bidders: [
      { kind: 'cartel', id: 'cartel-1', name: '담합꾼 형', partnerId: 'cartel-2' },
      { kind: 'cartel', id: 'cartel-2', name: '담합꾼 아우', partnerId: 'cartel-1' },
      { kind: 'honest', id: 'honest-1' },
    ],
  },
  {
    id: 7,
    title: '스나이퍼의 밤',
    auctionType: 'dutch',
    rounds: 5,
    budget: 3500,
    coins: 2,
    sigma: 0.3,
    valueRange: { min: 400, max: 1600 },
    targetValue: 2000,
    dutchStepRange: { min: 0.02, max: 0.05 }, // 하강 속도 랜덤 (특이 조건)
    bidders: [
      { kind: 'sniper', id: 'sniper-1', name: '스나이퍼 A' },
      { kind: 'sniper', id: 'sniper-2', name: '스나이퍼 B', preferredCategory: 'art' },
      { kind: 'miser', id: 'miser-1' },
    ],
  },
  {
    id: 8,
    title: '그랜드 옥션',
    auctionType: 'mixed', // 라운드마다 방식 랜덤
    rounds: 6,
    budget: 4000,
    coins: 3,
    sigma: 0.35,
    valueRange: { min: 400, max: 1600 },
    targetValue: 2200,
    bidders: [
      { kind: 'honest', id: 'honest-1' },
      { kind: 'bulldozer', id: 'bulldozer-1', preferredCategory: 'art' },
      { kind: 'miser', id: 'miser-1', preferredCategory: 'antique' },
      { kind: 'sniper', id: 'sniper-1', preferredCategory: 'timepiece' },
    ],
  },
];

/** 스테이지 선택 화면의 슬롯 수 (커리큘럼 8개) */
export const TOTAL_STAGE_SLOTS = 8;

export function getStage(id: number): StageDef | undefined {
  return STAGES.find((s) => s.id === id);
}
