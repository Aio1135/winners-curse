import { CATEGORY_LABEL } from '../engine/items';
import type { BidderSpec } from '../engine/types';
import type { Bidder } from './types';
import { applyPreference, isPreferredItem } from './utils';

const fmt = (n: number) => n.toLocaleString('ko-KR');

/** 감정사: wtp = 감정치 × 1.0. 기준선 역할 — 선호 외 변주 없음 */
export function createHonest(spec: BidderSpec): Bidder {
  const name = spec.name ?? '감정사';
  return {
    id: spec.id,
    name,
    emoji: '🧐',
    tagline: '물건은 보이는 값만큼만. 그게 감정사의 원칙이오.',
    decide: (ctx) => ({
      wtp: applyPreference(ctx.appraisal, ctx, spec.preferredCategory),
    }),
    reviewLine: (ctx, outcome) => {
      const base = outcome.won
        ? `내 감정치는 ${fmt(ctx.appraisal)}. 딱 그만큼 불렀고, 그 값에 낙찰됐소.`
        : `내 감정치는 ${fmt(ctx.appraisal)}. 그 이상은 단 한 푼도 부르지 않소.`;
      return isPreferredItem(ctx, spec.preferredCategory)
        ? `${base} …솔직히 ${CATEGORY_LABEL[ctx.itemCategory]}이라 조금 더 얹긴 했소.`
        : base;
    },
  };
}
