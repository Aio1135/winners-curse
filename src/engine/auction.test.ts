import { describe, expect, it } from 'vitest';
import {
  claimDutch,
  dropFromEnglish,
  englishResult,
  runAuction,
  startDutch,
  startEnglish,
  tickDutch,
  tickEnglish,
  type AuctionEntry,
} from './auction';
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

describe('english (영국식, 공개 상승)', () => {
  const range = { min: 400, max: 1600 }; // 시작가 = 200

  it('시작가는 범위 하한의 50%고, 못 내는 참가자는 불참 처리된다', () => {
    const state = startEnglish([entry('a', 1000), entry('b', 150), entry('c', 800)], range);
    expect(state.price).toBe(200);
    expect(state.activeIds).toEqual(['a', 'c']);
    expect(state.drops).toEqual([{ id: 'b', bid: 0 }]);
    expect(state.finished).toBe(false);
  });

  it('시작가부터 1인만 남으면 시작가에 즉시 낙찰된다', () => {
    const state = startEnglish([entry('a', 1000), entry('b', 100)], range);
    expect(state.finished).toBe(true);
    expect(state.winnerId).toBe('a');
    expect(state.finalPrice).toBe(200);
  });

  it('전원이 시작가 미만이면 유찰된다', () => {
    const state = startEnglish([entry('a', 100), entry('b', 50)], range);
    expect(state.finished).toBe(true);
    expect(state.winnerId).toBeNull();
  });

  it('호가가 5%씩 오르고, 한도를 넘긴 참가자가 탈락해 마지막 1인이 낙찰된다', () => {
    const entries = [entry('a', 1000), entry('b', 600)];
    let state = startEnglish(entries, range);
    const rng = createRng(1);
    while (!state.finished) state = tickEnglish(state, entries, rng);
    expect(state.winnerId).toBe('a');
    // b는 600 초과 첫 호가에서 탈락, a는 그 호가를 지불 (차순위 한도 근처)
    expect(state.finalPrice).toBeGreaterThan(600);
    expect(state.finalPrice).toBeLessThanOrEqual(Math.ceil(600 * 1.05));
    const result = englishResult(state);
    expect(result.price).toBe(state.finalPrice);
    expect(result.bids.find((b) => b.id === 'b')!.bid).toBe(state.finalPrice);
  });

  it('예산이 wtp보다 작으면 예산이 한도가 된다', () => {
    const entries = [entry('a', 2000, 500), entry('b', 900)];
    let state = startEnglish(entries, range);
    const rng = createRng(1);
    while (!state.finished) state = tickEnglish(state, entries, rng);
    expect(state.winnerId).toBe('b');
  });

  it('전원 동시 탈락이면 직전 호가에서 무작위 낙찰된다', () => {
    const entries = [entry('a', 500), entry('b', 500)];
    let state = startEnglish(entries, range);
    const rng = createRng(3);
    while (!state.finished) state = tickEnglish(state, entries, rng);
    expect(['a', 'b']).toContain(state.winnerId);
    expect(state.finalPrice).toBeLessThanOrEqual(500);
  });

  it('자발적 포기로 1인이 남으면 현재 호가에 낙찰된다', () => {
    const entries = [entry('player', 10_000), entry('b', 900)];
    let state = startEnglish(entries, range);
    state = tickEnglish(state, entries, createRng(1)); // 210
    state = dropFromEnglish(state, 'player');
    expect(state.finished).toBe(true);
    expect(state.winnerId).toBe('b');
    expect(state.finalPrice).toBe(state.price);
  });
});

describe('dutch (네덜란드식, 공개 하강)', () => {
  const range = { min: 400, max: 1600 }; // 시작가 2400, 하한 320

  it('시작가는 범위 상한의 150%, 하한은 상한의 20%다', () => {
    const state = startDutch([entry('a', 800)], range, createRng(1));
    expect(state.startPrice).toBe(2400);
    expect(state.floor).toBe(320);
    expect(state.finished).toBe(false);
  });

  it('가격이 목표가에 닿은 AI가 즉시 낙찰된다', () => {
    const entries = [entry('a', 800), entry('b', 600)];
    let state = startDutch(entries, range, createRng(1));
    const rng = createRng(1);
    while (!state.finished) state = tickDutch(state, entries, rng);
    expect(state.winnerId).toBe('a');
    expect(state.finalPrice).toBeLessThanOrEqual(800);
    expect(state.finalPrice).toBeGreaterThan(800 * 0.97 - 1);
  });

  it('아무도 안 사면 하한에서 유찰된다', () => {
    const entries = [entry('a', 100)];
    let state = startDutch(entries, range, createRng(1));
    const rng = createRng(1);
    while (!state.finished) state = tickDutch(state, entries, rng);
    expect(state.winnerId).toBeNull();
    expect(state.price).toBe(320);
  });

  it('플레이어가 먼저 누르면 그 가격에 낙찰된다', () => {
    let state = startDutch([entry('a', 500)], range, createRng(1));
    state = tickDutch(state, [entry('a', 500)], createRng(1));
    const claimed = claimDutch(state, 'player', 10_000);
    expect(claimed.finished).toBe(true);
    expect(claimed.winnerId).toBe('player');
    expect(claimed.finalPrice).toBe(state.price);
  });

  it('예산이 모자라면 낙찰 버튼이 무시된다', () => {
    const state = startDutch([entry('a', 500)], range, createRng(1));
    expect(claimDutch(state, 'player', 100).finished).toBe(false);
  });

  it('복기 기록에 낙찰자는 낙찰가, 나머지 AI는 목표가가 남는다', () => {
    const entries = [entry('a', 800), entry('b', 600)];
    const result = runAuction('dutch', entries, createRng(1), range);
    expect(result.winnerId).toBe('a');
    expect(result.bids.find((b) => b.id === 'b')!.bid).toBe(600);
  });
});

describe('runAuction 공통', () => {
  it('실시간 방식은 valueRange 없이 호출하면 던진다', () => {
    expect(() => runAuction('english', [entry('a', 100)], createRng(1))).toThrow();
    expect(() => runAuction('dutch', [entry('a', 100)], createRng(1))).toThrow();
  });

  it('같은 시드는 같은 실시간 경매 결과를 만든다', () => {
    const entries = [entry('a', 900), entry('b', 900)];
    const range = { min: 400, max: 1600 };
    const r1 = runAuction('english', entries, createRng(7), range);
    const r2 = runAuction('english', entries, createRng(7), range);
    expect(r1).toEqual(r2);
  });
});
