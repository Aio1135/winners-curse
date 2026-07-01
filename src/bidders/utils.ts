import type { ItemCategory } from '../engine/types';
import type { BidderContext } from './types';

/** 선호 카테고리 가산 배율 (임시 수치 — D5 밸런싱 대상) */
export const PREFERENCE_BOOST = 1.15;

/** 이번 라운드 아이템이 선호 카테고리인가 */
export function isPreferredItem(
  ctx: BidderContext,
  preferred: ItemCategory | undefined,
): boolean {
  return preferred !== undefined && ctx.itemCategory === preferred;
}

export function applyPreference(
  wtp: number,
  ctx: BidderContext,
  preferred: ItemCategory | undefined,
): number {
  return isPreferredItem(ctx, preferred) ? wtp * PREFERENCE_BOOST : wtp;
}

/** 직전 라운드부터 거슬러 연속으로 낙찰하지 못한 횟수 */
export function consecutiveLosses(ctx: BidderContext, bidderId: string): number {
  let losses = 0;
  for (let i = ctx.history.length - 1; i >= 0; i -= 1) {
    if (ctx.history[i].winnerId === bidderId) break;
    losses += 1;
  }
  return losses;
}

/** 이번 스테이지에서 한 번이라도 낙찰했는가 */
export function hasWonAny(ctx: BidderContext, bidderId: string): boolean {
  return ctx.history.some((r) => r.winnerId === bidderId);
}
