import { describe, expect, it } from 'vitest';
import { createRng } from '../engine/rng';
import type { RoundRecord } from '../engine/types';
import { createBidder } from './index';
import type { BidderContext, BidderOutcome } from './types';
import { PREFERENCE_BOOST, consecutiveLosses } from './utils';

function ctx(overrides: Partial<BidderContext> = {}): BidderContext {
  return {
    appraisal: 1000,
    budget: 3000,
    auctionType: 'sealed-first',
    itemCategory: 'collectible',
    roundIndex: 0,
    totalRounds: 4,
    history: [],
    rng: createRng(1),
    ...overrides,
  };
}

/** winnerId만 의미 있는 최소 라운드 기록 */
function lossRecord(roundIndex: number, winnerId: string | null): RoundRecord {
  return {
    roundIndex,
    auctionType: 'sealed-first',
    itemId: `item-${roundIndex}`,
    itemName: '은촛대',
    itemEmoji: '🕯️',
    itemValue: 1000,
    winnerId,
    price: 0,
    profit: 0,
    winnersCurse: false,
    bids: [],
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
  it('wtp = 감정치 그대로 (기준선)', () => {
    const bidder = createBidder({ kind: 'honest', id: 'h1' });
    expect(bidder.decide(ctx()).wtp).toBe(1000);
  });
});

describe('bulldozer (불도저)', () => {
  it('wtp = 감정치 × 1.15~1.3 (변주 조건 없을 때)', () => {
    const bidder = createBidder({ kind: 'bulldozer', id: 'b1' });
    for (let seed = 0; seed < 50; seed += 1) {
      const { wtp } = bidder.decide(ctx({ rng: createRng(seed) }));
      expect(wtp).toBeGreaterThanOrEqual(1000 * 1.15);
      expect(wtp).toBeLessThanOrEqual(1000 * 1.3);
    }
  });

  it('연속 미낙찰 1회당 +0.05 분노 가산 (최대 +0.15)', () => {
    const bidder = createBidder({ kind: 'bulldozer', id: 'b1' });
    const twoLosses = [lossRecord(0, 'x'), lossRecord(1, null)];
    for (let seed = 0; seed < 30; seed += 1) {
      const { wtp } = bidder.decide(ctx({ history: twoLosses, rng: createRng(seed) }));
      expect(wtp).toBeGreaterThanOrEqual(1000 * 1.25);
      expect(wtp).toBeLessThanOrEqual(1000 * 1.4);
    }
    // 5연패여도 가산은 +0.15에서 멈춘다
    const fiveLosses = Array.from({ length: 5 }, (_, i) => lossRecord(i, 'x'));
    for (let seed = 0; seed < 30; seed += 1) {
      const { wtp } = bidder.decide(ctx({ history: fiveLosses, rng: createRng(seed) }));
      expect(wtp).toBeLessThanOrEqual(1000 * 1.45);
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

  it('마지막 2라운드 + 무낙찰이면 상한 완화: min(감정치 × 0.9, 예산 × 0.45)', () => {
    const bidder = createBidder({ kind: 'miser', id: 'm1' });
    const lateEmpty = ctx({ roundIndex: 2, history: [lossRecord(0, 'x'), lossRecord(1, 'x')] });
    expect(bidder.decide(lateEmpty).wtp).toBe(900);
    // 이미 낙찰한 적 있으면 평소대로
    const lateWon = ctx({ roundIndex: 2, history: [lossRecord(0, 'm1'), lossRecord(1, 'x')] });
    expect(bidder.decide(lateWon).wtp).toBe(800);
  });
});

describe('sniper (스나이퍼)', () => {
  it('실시간 방식에선 wtp = 감정치 × 0.95', () => {
    const bidder = createBidder({ kind: 'sniper', id: 's1' });
    expect(bidder.decide(ctx({ auctionType: 'english' })).wtp).toBe(950);
    expect(bidder.decide(ctx({ auctionType: 'dutch' })).wtp).toBe(950);
  });

  it('턴제(봉투)에선 honest와 동일하게 감정치 그대로', () => {
    const bidder = createBidder({ kind: 'sniper', id: 's1' });
    expect(bidder.decide(ctx({ auctionType: 'sealed-first' })).wtp).toBe(1000);
    expect(bidder.decide(ctx({ auctionType: 'sealed-second' })).wtp).toBe(1000);
  });

  it('잔류 표시를 숨긴다', () => {
    expect(createBidder({ kind: 'sniper', id: 's1' }).concealsStatus).toBe(true);
  });
});

describe('cartel (담합조)', () => {
  const spec1 = { kind: 'cartel', id: 'c1', partnerId: 'c2' } as const;
  const spec2 = { kind: 'cartel', id: 'c2', partnerId: 'c1' } as const;

  it('감정치 높은 쪽만 감정치대로 입찰하고, 낮은 쪽은 wtp 0', () => {
    const high = createBidder(spec1);
    const low = createBidder(spec2);
    expect(high.decide(ctx({ appraisal: 1000, partnerAppraisal: 800 })).wtp).toBe(1000);
    expect(low.decide(ctx({ appraisal: 800, partnerAppraisal: 1000 })).wtp).toBe(0);
  });

  it('감정치 동점이면 id가 앞선 쪽이 나선다 (결정적)', () => {
    const a = createBidder(spec1); // c1 < c2
    const b = createBidder(spec2);
    expect(a.decide(ctx({ appraisal: 900, partnerAppraisal: 900 })).wtp).toBe(900);
    expect(b.decide(ctx({ appraisal: 900, partnerAppraisal: 900 })).wtp).toBe(0);
  });

  it('복기 대사에서 담합 사실을 공개한다', () => {
    const low = createBidder(spec2);
    const line = low.reviewLine(ctx({ appraisal: 800, partnerAppraisal: 1000 }), outcome);
    expect(line).toContain('들러리');
  });
});

describe('선호 카테고리', () => {
  it('선호 아이템이면 wtp × 1.15', () => {
    const miser = createBidder({ kind: 'miser', id: 'm1', preferredCategory: 'antique' });
    expect(miser.decide(ctx({ itemCategory: 'antique' })).wtp).toBe(800 * PREFERENCE_BOOST);
    expect(miser.decide(ctx({ itemCategory: 'art' })).wtp).toBe(800);

    const honest = createBidder({ kind: 'honest', id: 'h1', preferredCategory: 'timepiece' });
    expect(honest.decide(ctx({ itemCategory: 'timepiece' })).wtp).toBe(1000 * PREFERENCE_BOOST);
  });
});

describe('utils', () => {
  it('consecutiveLosses는 직전부터 연속 미낙찰만 센다', () => {
    const history = [lossRecord(0, 'x'), lossRecord(1, 'b1'), lossRecord(2, 'x'), lossRecord(3, null)];
    expect(consecutiveLosses(ctx({ history }), 'b1')).toBe(2);
    expect(consecutiveLosses(ctx({ history: [] }), 'b1')).toBe(0);
  });
});

describe('공통', () => {
  it('복기 대사는 비어 있지 않다 (전 성격)', () => {
    for (const kind of ['honest', 'bulldozer', 'miser', 'sniper', 'cartel'] as const) {
      const bidder = createBidder({ kind, id: `${kind}-1`, preferredCategory: 'collectible' });
      expect(bidder.reviewLine(ctx(), outcome).length).toBeGreaterThan(0);
      expect(bidder.reviewLine(ctx(), { ...outcome, won: true }).length).toBeGreaterThan(0);
    }
  });
});
