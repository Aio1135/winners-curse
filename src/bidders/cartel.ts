import { CATEGORY_LABEL } from '../engine/items';
import type { BidderSpec } from '../engine/types';
import type { Bidder, BidderContext } from './types';
import { applyPreference, isPreferredItem } from './utils';

const fmt = (n: number) => n.toLocaleString('ko-KR');

/** 둘 중 감정치 높은 쪽만 나선다. 동점이면 id가 앞선 쪽 (결정적) */
function isDesignatedBidder(ctx: BidderContext, spec: BidderSpec): boolean {
  if (ctx.partnerAppraisal === undefined) return true; // 파트너 정보가 없으면 단독 행동
  if (ctx.appraisal !== ctx.partnerAppraisal) return ctx.appraisal > ctx.partnerAppraisal;
  return spec.id < (spec.partnerId ?? '');
}

/**
 * 담합조 (2인 1조): 높은 감정치 쪽만 wtp = 감정치 × 1.0, 다른 쪽은 wtp = 0.
 * 낙찰 이익은 공유(연출상). 복기에서 담합 사실을 반드시 공개한다.
 */
export function createCartel(spec: BidderSpec): Bidder {
  const name = spec.name ?? '담합꾼';
  return {
    id: spec.id,
    name,
    emoji: '🕶️',
    tagline: '경매장엔 아는 얼굴이 많을수록 좋지.',
    decide: (ctx) => {
      if (!isDesignatedBidder(ctx, spec)) return { wtp: 0 };
      return { wtp: applyPreference(ctx.appraisal, ctx, spec.preferredCategory) };
    },
    reviewLine: (ctx, outcome) => {
      const designated = isDesignatedBidder(ctx, spec);
      let line: string;
      if (designated) {
        line = outcome.won
          ? `실은 짜고 쳤다. 우리 둘 중 감정치 높은 쪽(${fmt(ctx.appraisal)})인 내가 나섰고, 파트너는 빠졌다. 이익은 나눠 갖는다.`
          : `실은 짜고 쳤다. 감정치 ${fmt(ctx.appraisal)}인 내가 대표로 나섰지만 이번엔 밀렸다.`;
      } else {
        line = `나는 들러리였다 — 파트너 감정치(${fmt(ctx.partnerAppraisal ?? 0)})가 내 것(${fmt(ctx.appraisal)})보다 높아서 빠졌다. 경쟁자 수를 속인 셈이지.`;
      }
      if (designated && isPreferredItem(ctx, spec.preferredCategory)) {
        line += ` ${CATEGORY_LABEL[ctx.itemCategory]}이라 더 세게 갔다.`;
      }
      return line;
    },
  };
}
