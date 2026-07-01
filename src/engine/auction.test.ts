import { describe, expect, it } from 'vitest';
import { runAuction, type AuctionEntry } from './auction';
import { createRng } from './rng';

function entry(id: string, wtp: number, budget = 10_000): AuctionEntry {
  return { id, wtp, budget };
}

describe('sealed-first (비공개 1가)', () => {
  it('최고가가 자기 입찰액을 지불하고 낙찰된다', () => {
    const result = runAuction(
      'sealed-first',
      [entry('a', 800), entry('b', 1000), entry('c', 600)],
      createRng(1),
    );
    expect(result.winnerId).toBe('b');
    expect(result.price).toBe(1000);
  });

  it('전원 0이면 유찰된다', () => {
    const result = runAuction('sealed-first', [entry('a', 0), entry('b', 0)], createRng(1));
    expect(result.winnerId).toBeNull();
    expect(result.price).toBe(0);
  });

  it('동점이면 시드 RNG로 동점자 중 한 명이 낙찰된다', () => {
    const entries = [entry('a', 900), entry('b', 900), entry('c', 100)];
    const result = runAuction('sealed-first', entries, createRng(7));
    expect(['a', 'b']).toContain(result.winnerId);
    expect(result.price).toBe(900);
    // 같은 시드 = 같은 결과
    const again = runAuction('sealed-first', entries, createRng(7));
    expect(again.winnerId).toBe(result.winnerId);
  });

  it('예산 0이면 불참 처리된다', () => {
    const result = runAuction(
      'sealed-first',
      [entry('broke', 1000, 0), entry('b', 500)],
      createRng(1),
    );
    expect(result.bids.find((b) => b.id === 'broke')?.bid).toBe(0);
    expect(result.winnerId).toBe('b');
  });

  it('wtp가 예산을 넘으면 예산까지만 입찰한다', () => {
    const result = runAuction('sealed-first', [entry('a', 2000, 700)], createRng(1));
    expect(result.bids[0].bid).toBe(700);
  });

  it('wtp 소수는 정수로 내림된다', () => {
    const result = runAuction('sealed-first', [entry('a', 999.9)], createRng(1));
    expect(result.bids[0].bid).toBe(999);
  });
});

describe('sealed-second (Vickrey)', () => {
  it('최고가가 낙찰하되 2등 가격을 지불한다', () => {
    const result = runAuction(
      'sealed-second',
      [entry('a', 800), entry('b', 1000), entry('c', 600)],
      createRng(1),
    );
    expect(result.winnerId).toBe('b');
    expect(result.price).toBe(800);
  });

  it('최고가 동점이면 지불 가격도 그 값이다', () => {
    const result = runAuction(
      'sealed-second',
      [entry('a', 900), entry('b', 900)],
      createRng(3),
    );
    expect(['a', 'b']).toContain(result.winnerId);
    expect(result.price).toBe(900);
  });

  it('경쟁 입찰이 없으면 0을 지불한다', () => {
    const result = runAuction(
      'sealed-second',
      [entry('a', 500), entry('b', 0)],
      createRng(1),
    );
    expect(result.winnerId).toBe('a');
    expect(result.price).toBe(0);
  });
});

describe('runAuction 공통', () => {
  it('미구현 방식은 던진다', () => {
    expect(() => runAuction('english', [entry('a', 100)], createRng(1))).toThrow();
  });
});
