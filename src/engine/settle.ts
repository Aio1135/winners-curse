import type { AuctionResult } from './auction';
import type { Item, RoundRecord } from './types';

/** 낙찰 확정 → 라운드 공개 기록 생성. 손익 = V − 낙찰가, 승자의 저주 = 손익 < 0 */
export function settleRound(
  roundIndex: number,
  item: Item,
  auction: AuctionResult,
): RoundRecord {
  const won = auction.winnerId !== null;
  const profit = won ? item.value - auction.price : 0;
  return {
    roundIndex,
    auctionType: auction.auctionType,
    itemId: item.id,
    itemName: item.name,
    itemEmoji: item.emoji,
    itemValue: item.value,
    winnerId: auction.winnerId,
    price: won ? auction.price : 0,
    profit,
    winnersCurse: won && profit < 0,
    bids: auction.bids,
    dutchStep: auction.dutchStep,
  };
}
