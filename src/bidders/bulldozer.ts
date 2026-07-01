import type { Bidder } from './types';

const fmt = (n: number) => n.toLocaleString('ko-KR');

/** 불도저: wtp = 감정치 × (1.15~1.3 랜덤). 예산 무시 성향, 승자의 저주 단골 */
export function createBulldozer(id: string, name = '불도저'): Bidder {
  return {
    id,
    name,
    emoji: '🦏',
    tagline: '값? 그런 건 이기고 나서 생각한다.',
    decide: (ctx) => {
      const multiplier = 1.15 + ctx.rng.next() * 0.15;
      return { wtp: ctx.appraisal * multiplier };
    },
    reviewLine: (ctx, outcome) => {
      const over = Math.round((outcome.bid / ctx.appraisal - 1) * 100);
      return outcome.won
        ? `감정치 ${fmt(ctx.appraisal)}에 ${over}% 얹어서 ${fmt(outcome.bid)}. 밀어붙이면 다 내 거다!`
        : `감정치 ${fmt(ctx.appraisal)}에 ${over}%나 얹었는데도 밀리다니… 다음엔 더 세게 간다.`;
    },
  };
}
