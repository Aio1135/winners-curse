import { CATEGORY_LABEL } from '../engine/items';
import type { BidderSpec } from '../engine/types';
import type { Bidder } from './types';
import { applyPreference, consecutiveLosses, isPreferredItem } from './utils';

const fmt = (n: number) => n.toLocaleString('ko-KR');

/** 분노 가산: 연속 미낙찰 1회당 +0.05, 최대 +0.15 */
function rageBonus(losses: number): number {
  return Math.min(0.15, 0.05 * losses);
}

/** 불도저: wtp = 감정치 × (1.15~1.3 랜덤 + 분노). 예산 무시 성향, 승자의 저주 단골 */
export function createBulldozer(spec: BidderSpec): Bidder {
  const name = spec.name ?? '불도저';
  return {
    id: spec.id,
    name,
    emoji: '🦏',
    tagline: '값? 그런 건 이기고 나서 생각한다.',
    decide: (ctx) => {
      const multiplier =
        1.15 + ctx.rng.next() * 0.15 + rageBonus(consecutiveLosses(ctx, spec.id));
      return { wtp: applyPreference(ctx.appraisal * multiplier, ctx, spec.preferredCategory) };
    },
    reviewLine: (ctx, outcome) => {
      const losses = consecutiveLosses(ctx, spec.id);
      const over = Math.round((outcome.bid / ctx.appraisal - 1) * 100);
      let line = outcome.won
        ? `감정치 ${fmt(ctx.appraisal)}에 ${over}% 얹어서 ${fmt(outcome.bid)}. 밀어붙이면 다 내 거다!`
        : `감정치 ${fmt(ctx.appraisal)}에 ${over}%나 얹었는데도 밀리다니… 다음엔 더 세게 간다.`;
      if (losses > 0) {
        line += ` ${losses}라운드 연속 빈손이라 더 세게 나갔다.`;
      }
      if (isPreferredItem(ctx, spec.preferredCategory)) {
        line += ` 게다가 ${CATEGORY_LABEL[ctx.itemCategory]}은 못 참지.`;
      }
      return line;
    },
  };
}
