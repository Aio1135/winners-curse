import { describe, expect, it } from 'vitest';
import type { AuctionResult } from './auction';
import { settleRound } from './settle';
import type { Item } from './types';

const item: Item = {
  id: 'item-0',
  name: '은촛대',
  emoji: '🕯️',
  category: 'antique',
  value: 1000,
};

function auctionResult(winnerId: string | null, price: number): AuctionResult {
  return {
    auctionType: 'sealed-first',
    bids: [{ id: 'a', bid: price }],
    winnerId,
    price,
  };
}

describe('settleRound', () => {
  it('싸게 낙찰하면 손익이 양수고 저주가 아니다', () => {
    const record = settleRound(0, item, auctionResult('a', 800));
    expect(record.profit).toBe(200);
    expect(record.winnersCurse).toBe(false);
  });

  it('진짜 가치보다 비싸게 낙찰하면 승자의 저주다', () => {
    const record = settleRound(0, item, auctionResult('a', 1200));
    expect(record.profit).toBe(-200);
    expect(record.winnersCurse).toBe(true);
  });

  it('정확히 V에 낙찰하면 손익 0, 저주 아님', () => {
    const record = settleRound(0, item, auctionResult('a', 1000));
    expect(record.profit).toBe(0);
    expect(record.winnersCurse).toBe(false);
  });

  it('유찰이면 가격·손익 0, 저주 아님', () => {
    const record = settleRound(0, item, auctionResult(null, 0));
    expect(record.winnerId).toBeNull();
    expect(record.price).toBe(0);
    expect(record.profit).toBe(0);
    expect(record.winnersCurse).toBe(false);
  });
});
