import { describe, expect, it } from 'vitest';
import { buildReview } from './review';
import type { RoundRecord } from './types';

const record: RoundRecord = {
  roundIndex: 0,
  auctionType: 'sealed-first',
  itemId: 'item-0',
  itemValue: 1000,
  winnerId: 'ai-1',
  price: 900,
  profit: 100,
  winnersCurse: false,
  bids: [
    { id: 'player', bid: 700 },
    { id: 'ai-1', bid: 900 },
    { id: 'ai-2', bid: 0 },
  ],
};

describe('buildReview', () => {
  it('전원의 입찰액을 매핑하고 낙찰자를 표시한다', () => {
    const review = buildReview(record, [
      { id: 'player', name: '나', emoji: '🙂', appraisal: 750, line: null },
      { id: 'ai-1', name: '감정사', emoji: '🧐', appraisal: 950, line: '그만큼 불렀소.' },
      { id: 'ai-2', name: '구두쇠', emoji: '🪙', appraisal: 600, line: '너무 비싸.' },
    ]);
    expect(review.itemValue).toBe(1000);
    expect(review.entries.map((e) => e.bid)).toEqual([700, 900, 0]);
    expect(review.entries.find((e) => e.id === 'ai-1')?.isWinner).toBe(true);
    expect(review.entries.find((e) => e.id === 'player')?.isWinner).toBe(false);
  });
});
