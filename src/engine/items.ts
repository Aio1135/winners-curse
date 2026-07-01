import type { Rng } from './rng';
import type { Appraisal, Item, ValueRange } from './types';

/** 기본 감정 오차 폭 (스테이지별 조정 가능) */
export const DEFAULT_SIGMA = 0.3;
/** 감정 의뢰(코인 1개) 시 재추첨되는 오차 폭 */
export const APPRAISAL_SIGMA = 0.1;

// 아이템 아트 금지 — 이모지 + 텍스트로만 표현한다.
const ITEM_POOL: ReadonlyArray<{ name: string; emoji: string }> = [
  { name: '오래된 회중시계', emoji: '⌚' },
  { name: '빛바랜 유화', emoji: '🖼️' },
  { name: '고려청자 (진위 불명)', emoji: '🏺' },
  { name: '초판 만화책', emoji: '📖' },
  { name: '은촛대', emoji: '🕯️' },
  { name: '골동품 축음기', emoji: '📻' },
  { name: '상아 체스 세트', emoji: '♟️' },
  { name: '선원의 망원경', emoji: '🔭' },
  { name: '작가의 타자기', emoji: '⌨️' },
  { name: '괘종시계', emoji: '🕰️' },
  { name: '보석 브로치', emoji: '💎' },
  { name: '골동품 지구본', emoji: '🌍' },
];

/** 라운드에 올릴 아이템 생성. 진짜 가치 V는 범위 내 정수 */
export function generateItem(roundIndex: number, range: ValueRange, rng: Rng): Item {
  const art = rng.pick(ITEM_POOL);
  return {
    id: `item-${roundIndex}`,
    name: art.name,
    emoji: art.emoji,
    value: rng.int(range.min, range.max),
  };
}

/** 감정치 추첨: s = round(V × (1 + ε)), ε ~ Uniform(−σ, +σ) */
export function appraise(value: number, sigma: number, rng: Rng): Appraisal {
  const epsilon = (rng.next() * 2 - 1) * sigma;
  return { value: Math.round(value * (1 + epsilon)), sigma };
}
