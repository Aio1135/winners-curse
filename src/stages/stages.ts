import type { StageDef } from '../engine/types';

// ⚠️ 밸런싱 수치(예산·목표치·가치 범위)는 전부 임시값 — D5에서 사람이 결정한다.
// 커리큘럼 §7과 1:1. D2에서는 봉투 방식 스테이지 2·3만 플레이 가능.
export const STAGES: StageDef[] = [
  {
    id: 1,
    title: '첫 망치소리',
    auctionType: 'english',
    rounds: 3,
    budget: 3000,
    coins: 2,
    sigma: 0.1,
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
    // TODO(D5): sniper 구현 후 §7대로 honest + sniper 조합으로 교체
    bidders: [
      { kind: 'honest', id: 'honest-1' },
      { kind: 'miser', id: 'miser-1', preferredCategory: 'timepiece' },
    ],
  },
];

/** 스테이지 선택 화면의 슬롯 수 (커리큘럼 8개) */
export const TOTAL_STAGE_SLOTS = 8;

export function getStage(id: number): StageDef | undefined {
  return STAGES.find((s) => s.id === id);
}
