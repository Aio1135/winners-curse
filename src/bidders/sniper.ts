import { CATEGORY_LABEL } from '../engine/items';
import type { BidderSpec } from '../engine/types';
import type { Bidder, BidderContext } from './types';
import { applyPreference, isPreferredItem } from './utils';

const fmt = (n: number) => n.toLocaleString('ko-KR');

function isRealtime(ctx: BidderContext): boolean {
  return ctx.auctionType === 'english' || ctx.auctionType === 'dutch';
}

/**
 * 스나이퍼: 실시간 방식에서 wtp = 감정치 × 0.95, 막판까지 행동을 숨긴다
 * (영국식 잔류 표시를 애매하게 — concealsStatus). 턴제에선 honest와 동일.
 */
export function createSniper(spec: BidderSpec): Bidder {
  const name = spec.name ?? '스나이퍼';
  return {
    id: spec.id,
    name,
    emoji: '🎯',
    tagline: '내 패는 마지막 순간까지 아무도 모른다.',
    concealsStatus: true,
    decide: (ctx) => {
      const factor = isRealtime(ctx) ? 0.95 : 1.0;
      return { wtp: applyPreference(ctx.appraisal * factor, ctx, spec.preferredCategory) };
    },
    reviewLine: (ctx, outcome) => {
      let line: string;
      if (isRealtime(ctx)) {
        line = outcome.won
          ? `낌새를 안 보이다가 감정치 ${fmt(ctx.appraisal)}의 95% 선에서 정확히 걷어갔다.`
          : `내 한도는 감정치 ${fmt(ctx.appraisal)}의 95% — 그 위로는 안 쫓는다. 티는 안 냈지만.`;
      } else {
        line = outcome.won
          ? `봉투 앞에선 숨길 것도 없다. 감정치 ${fmt(ctx.appraisal)} 그대로 냈고, 가져갔다.`
          : `봉투 앞에선 숨길 것도 없다. 감정치 ${fmt(ctx.appraisal)} 그대로 냈다.`;
      }
      if (isPreferredItem(ctx, spec.preferredCategory)) {
        line += ` ${CATEGORY_LABEL[ctx.itemCategory]}은 내 전문 분야라 좀 더 노렸다.`;
      }
      return line;
    },
  };
}
