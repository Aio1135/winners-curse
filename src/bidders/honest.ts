import type { Bidder } from './types';

const fmt = (n: number) => n.toLocaleString('ko-KR');

/** 감정사: wtp = 감정치 × 1.0. 기준선 역할 */
export function createHonest(id: string, name = '감정사'): Bidder {
  return {
    id,
    name,
    emoji: '🧐',
    tagline: '물건은 보이는 값만큼만. 그게 감정사의 원칙이오.',
    decide: (ctx) => ({ wtp: ctx.appraisal }),
    reviewLine: (ctx, outcome) =>
      outcome.won
        ? `내 감정치는 ${fmt(ctx.appraisal)}. 딱 그만큼 불렀고, 그 값에 낙찰됐소.`
        : `내 감정치는 ${fmt(ctx.appraisal)}. 그 이상은 단 한 푼도 부르지 않소.`,
  };
}
