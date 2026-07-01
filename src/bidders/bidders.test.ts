import { describe, expect, it } from 'vitest';
import { createRng } from '../engine/rng';
import { createBidder } from './index';
import type { BidderContext, BidderOutcome } from './types';

function ctx(overrides: Partial<BidderContext> = {}): BidderContext {
  return {
    appraisal: 1000,
    budget: 3000,
    auctionType: 'sealed-first',
    roundIndex: 0,
    history: [],
    rng: createRng(1),
    ...overrides,
  };
}

const outcome: BidderOutcome = {
  won: false,
  bid: 800,
  winnerId: 'x',
  price: 900,
  itemValue: 1000,
};

describe('honest (감정사)', () => {
  it('wtp = 감정치 그대로', () => {
    const bidder = createBidder({ kind: 'honest', id: 'h1' });
    expect(bidder.decide(ctx()).wtp).toBe(1000);
  });
});

describe('bulldozer (불도저)', () => {
  it('wtp = 감정치 × 1.15~1.3', () => {
    const bidder = createBidder({ kind: 'bulldozer', id: 'b1' });
    for (let seed = 0; seed < 50; seed += 1) {
      const { wtp } = bidder.decide(ctx({ rng: createRng(seed) }));
      expect(wtp).toBeGreaterThanOrEqual(1000 * 1.15);
      expect(wtp).toBeLessThanOrEqual(1000 * 1.3);
    }
  });

  it('같은 시드는 같은 wtp를 만든다', () => {
    const bidder = createBidder({ kind: 'bulldozer', id: 'b1' });
    expect(bidder.decide(ctx({ rng: createRng(9) })).wtp).toBe(
      bidder.decide(ctx({ rng: createRng(9) })).wtp,
    );
  });
});

describe('miser (구두쇠)', () => {
  it('wtp = min(감정치 × 0.8, 예산 × 0.3)', () => {
    const bidder = createBidder({ kind: 'miser', id: 'm1' });
    // 감정치 쪽이 상한: 0.8 × 1000 = 800 < 0.3 × 3000 = 900
    expect(bidder.decide(ctx()).wtp).toBe(800);
    // 예산 쪽이 상한: 0.3 × 1000 = 300 < 0.8 × 1000 = 800
    expect(bidder.decide(ctx({ budget: 1000 })).wtp).toBe(300);
  });
});

describe('공통', () => {
  it('복기 대사는 비어 있지 않다', () => {
    for (const kind of ['honest', 'bulldozer', 'miser'] as const) {
      const bidder = createBidder({ kind, id: `${kind}-1` });
      expect(bidder.reviewLine(ctx(), outcome).length).toBeGreaterThan(0);
      expect(bidder.reviewLine(ctx(), { ...outcome, won: true }).length).toBeGreaterThan(0);
    }
  });

  it('미구현 성격은 던진다', () => {
    expect(() => createBidder({ kind: 'sniper', id: 's1' })).toThrow();
  });
});
