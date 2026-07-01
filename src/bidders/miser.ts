import { CATEGORY_LABEL } from '../engine/items';
import type { BidderSpec } from '../engine/types';
import type { Bidder, BidderContext } from './types';
import { applyPreference, hasWonAny, isPreferredItem } from './utils';

const fmt = (n: number) => n.toLocaleString('ko-KR');

/** 막판 빈손이면 상한을 완화한다 (마지막 2라운드 진입 + 무낙찰) */
function isDesperate(ctx: BidderContext, bidderId: string): boolean {
  return ctx.roundIndex >= ctx.totalRounds - 2 && !hasWonAny(ctx, bidderId);
}

/** 구두쇠: wtp = min(감정치 × 0.8, 남은예산 × 0.3). 절대 무리 안 함 */
export function createMiser(spec: BidderSpec): Bidder {
  const name = spec.name ?? '구두쇠';
  return {
    id: spec.id,
    name,
    emoji: '🪙',
    tagline: '싸게 사는 게 버는 거다. 비싸면 안 산다.',
    decide: (ctx) => {
      const cap = isDesperate(ctx, spec.id)
        ? Math.min(ctx.appraisal * 0.9, ctx.budget * 0.45)
        : Math.min(ctx.appraisal * 0.8, ctx.budget * 0.3);
      return { wtp: applyPreference(cap, ctx, spec.preferredCategory) };
    },
    reviewLine: (ctx, outcome) => {
      const desperate = isDesperate(ctx, spec.id);
      let line: string;
      if (desperate) {
        line = outcome.won
          ? `빈손으로 끝날 순 없어서 지갑을 좀 열었다. ${fmt(outcome.bid)}에 낙찰 — 이 정도면 남는 장사야.`
          : `빈손으로 끝날 순 없어서 ${fmt(outcome.bid)}까지는 열어뒀는데… 그래도 그 이상은 못 줘.`;
      } else {
        line = outcome.won
          ? `감정치 ${fmt(ctx.appraisal)}의 8할, 예산의 3할 안쪽인 ${fmt(outcome.bid)}에 건졌다. 이게 장사지.`
          : `감정치 ${fmt(ctx.appraisal)}의 8할, 예산의 3할 — 내 상한은 ${fmt(outcome.bid)}까지. 그보다 비싸면 안 사.`;
      }
      if (isPreferredItem(ctx, spec.preferredCategory)) {
        line += ` ${CATEGORY_LABEL[ctx.itemCategory]}이니까 특별히 좀 더 쳐준 거다.`;
      }
      return line;
    },
  };
}
