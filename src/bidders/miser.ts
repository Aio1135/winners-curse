import type { Bidder } from './types';

const fmt = (n: number) => n.toLocaleString('ko-KR');

/** 구두쇠: wtp = min(감정치 × 0.8, 남은예산 × 0.3). 절대 무리 안 함 */
export function createMiser(id: string, name = '구두쇠'): Bidder {
  return {
    id,
    name,
    emoji: '🪙',
    tagline: '싸게 사는 게 버는 거다. 비싸면 안 산다.',
    decide: (ctx) => ({
      wtp: Math.min(ctx.appraisal * 0.8, ctx.budget * 0.3),
    }),
    reviewLine: (ctx, outcome) =>
      outcome.won
        ? `감정치 ${fmt(ctx.appraisal)}의 8할, 예산의 3할 안쪽인 ${fmt(outcome.bid)}에 건졌다. 이게 장사지.`
        : `감정치 ${fmt(ctx.appraisal)}의 8할, 예산의 3할 — 내 상한은 ${fmt(outcome.bid)}까지. 그보다 비싸면 안 사.`,
  };
}
