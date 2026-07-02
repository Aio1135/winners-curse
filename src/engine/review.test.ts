import { describe, expect, it } from 'vitest';
import { buildReview, type ReviewParticipantInput } from './review';
import type { AuctionType, PlacedBid, RoundRecord } from './types';

function record(overrides: {
  auctionType?: AuctionType;
  itemValue?: number;
  winnerId?: string | null;
  price?: number;
  bids: PlacedBid[];
}): RoundRecord {
  const won = (overrides.winnerId ?? null) !== null;
  const itemValue = overrides.itemValue ?? 1000;
  const price = overrides.price ?? 0;
  return {
    roundIndex: 0,
    auctionType: overrides.auctionType ?? 'sealed-first',
    itemId: 'item-0',
    itemValue,
    winnerId: overrides.winnerId ?? null,
    price,
    profit: won ? itemValue - price : 0,
    winnersCurse: won && itemValue - price < 0,
    bids: overrides.bids,
  };
}

function participant(
  id: string,
  appraisal: number,
  line: string | null = null,
): ReviewParticipantInput {
  return { id, name: id, emoji: '🙂', appraisal, line };
}

describe('buildReview 기본', () => {
  it('전원의 입찰액을 매핑하고 낙찰자를 표시한다', () => {
    const review = buildReview(
      record({ winnerId: 'ai-1', price: 900, bids: [
        { id: 'player', bid: 700 },
        { id: 'ai-1', bid: 900 },
        { id: 'ai-2', bid: 0 },
      ] }),
      [participant('player', 750), participant('ai-1', 950), participant('ai-2', 600)],
      'player',
    );
    expect(review.entries.map((e) => e.bid)).toEqual([700, 900, 0]);
    expect(review.entries.find((e) => e.id === 'ai-1')?.isWinner).toBe(true);
    expect(review.auctionType).toBe('sealed-first');
  });
});

describe('판별 피드백 — Vickrey 정직 입찰 검증', () => {
  it('낮춰 불러서 기회를 놓쳤으면 정직 입찰 대비 손익 차이를 제시한다', () => {
    // 감정치 950, 실제 700 제출 → 패배. 정직했다면 900 지불로 낙찰, V=1000 → +100
    const review = buildReview(
      record({ auctionType: 'sealed-second', winnerId: 'ai-1', price: 700, bids: [
        { id: 'player', bid: 700 },
        { id: 'ai-1', bid: 900 },
      ] }),
      [participant('player', 950), participant('ai-1', 900)],
      'player',
    );
    const line = review.feedback.find((f) => f.includes('그대로 불렀다면'));
    expect(line).toBeDefined();
    expect(line).toContain('100');
  });

  it('감정치 그대로 불렀으면 우월전략임을 확인해준다', () => {
    const review = buildReview(
      record({ auctionType: 'sealed-second', winnerId: 'player', price: 800, bids: [
        { id: 'player', bid: 950 },
        { id: 'ai-1', bid: 800 },
      ] }),
      [participant('player', 950), participant('ai-1', 800)],
      'player',
    );
    expect(review.feedback.some((f) => f.includes('우월전략'))).toBe(true);
  });

  it('1가 경매에는 Vickrey 피드백이 없다', () => {
    const review = buildReview(
      record({ auctionType: 'sealed-first', winnerId: 'player', price: 700, bids: [
        { id: 'player', bid: 700 },
        { id: 'ai-1', bid: 500 },
      ] }),
      [participant('player', 950), participant('ai-1', 500)],
      'player',
    );
    expect(review.feedback.some((f) => f.includes('우월전략'))).toBe(false);
  });
});

describe('판별 피드백 — 네덜란드식 대기 검증', () => {
  it('더 기다릴 수 있었으면 절약 가능액과 AI 목표가를 알려준다', () => {
    // 1,184에 낙찰. AI 목표가 최고 808 → 여러 틱 더 기다릴 수 있었다
    const review = buildReview(
      record({ auctionType: 'dutch', winnerId: 'player', price: 1184, bids: [
        { id: 'player', bid: 1184 },
        { id: 'ai-1', bid: 808 },
      ] }),
      [participant('player', 966), participant('ai-1', 808)],
      'player',
    );
    const line = review.feedback.find((f) => f.includes('틱 더 기다렸으면'));
    expect(line).toBeDefined();
    expect(line).toContain('808');
  });

  it('한계 직전에 낚아챘으면 그렇게 말해준다', () => {
    // 830에 낙찰, AI 목표가 810: 다음 틱 가격 floor(830×0.97)=805 ≤ 810 → 더 못 기다림
    const review = buildReview(
      record({ auctionType: 'dutch', winnerId: 'player', price: 830, bids: [
        { id: 'player', bid: 830 },
        { id: 'ai-1', bid: 810 },
      ] }),
      [participant('player', 900), participant('ai-1', 810)],
      'player',
    );
    expect(review.feedback.some((f) => f.includes('잘 낚아챘다'))).toBe(true);
  });
});

describe('판별 피드백 — 승자의 저주·패스', () => {
  it('승자의 저주가 나면 원리를 설명한다', () => {
    const review = buildReview(
      record({ winnerId: 'player', itemValue: 641, price: 666, bids: [
        { id: 'player', bid: 666 },
        { id: 'ai-1', bid: 603 },
      ] }),
      [participant('player', 624), participant('ai-1', 580)],
      'player',
    );
    expect(review.feedback.some((f) => f.includes('승자의 저주'))).toBe(true);
  });

  it('패스한 라운드에 놓친 기회를 요약한다 (V > 낙찰가)', () => {
    const review = buildReview(
      record({ winnerId: 'ai-1', itemValue: 1000, price: 800, bids: [
        { id: 'player', bid: 0 },
        { id: 'ai-1', bid: 800 },
      ] }),
      [participant('player', 900), participant('ai-1', 800)],
      'player',
    );
    expect(review.feedback.some((f) => f.includes('기회를 놓쳤다'))).toBe(true);
  });

  it('패스가 옳았으면 그렇게 말해준다 (V ≤ 낙찰가)', () => {
    const review = buildReview(
      record({ winnerId: 'ai-1', itemValue: 700, price: 800, bids: [
        { id: 'player', bid: 0 },
        { id: 'ai-1', bid: 800 },
      ] }),
      [participant('player', 750), participant('ai-1', 900)],
      'player',
    );
    expect(review.feedback.some((f) => f.includes('참여 안 하길 잘했다'))).toBe(true);
  });

  it('패스했는데 유찰이면 그 사실을 알려준다', () => {
    const review = buildReview(
      record({ winnerId: null, bids: [
        { id: 'player', bid: 0 },
        { id: 'ai-1', bid: 0 },
      ] }),
      [participant('player', 750), participant('ai-1', 600)],
      'player',
    );
    expect(review.feedback.some((f) => f.includes('유찰'))).toBe(true);
  });
});
