import { describe, expect, it } from 'vitest';
import { acquiredValue, isStageCleared } from './stage';
import type { RoundRecord, StageDef } from './types';

function record(roundIndex: number, winnerId: string | null, itemValue: number): RoundRecord {
  return {
    roundIndex,
    auctionType: 'sealed-first',
    itemId: `item-${roundIndex}`,
    itemValue,
    winnerId,
    price: 0,
    profit: 0,
    winnersCurse: false,
    bids: [],
  };
}

const stage: StageDef = {
  id: 2,
  title: '봉투 속 숫자',
  auctionType: 'sealed-first',
  rounds: 4,
  budget: 3000,
  coins: 2,
  sigma: 0.2,
  valueRange: { min: 400, max: 1600 },
  targetValue: 1500,
  bidders: [],
};

describe('acquiredValue', () => {
  it('내가 낙찰한 라운드의 진짜 가치만 합산한다', () => {
    const history = [
      record(0, 'player', 800),
      record(1, 'ai-1', 900),
      record(2, null, 1000),
      record(3, 'player', 700),
    ];
    expect(acquiredValue(history, 'player')).toBe(1500);
  });
});

describe('isStageCleared', () => {
  it('목표치 이상이면 클리어다 (경계 포함)', () => {
    const history = [record(0, 'player', 1500)];
    expect(isStageCleared(stage, history, 'player')).toBe(true);
  });

  it('목표치 미만이면 실패다', () => {
    const history = [record(0, 'player', 1499)];
    expect(isStageCleared(stage, history, 'player')).toBe(false);
  });
});
