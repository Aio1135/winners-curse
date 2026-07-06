import { describe, expect, it } from 'vitest';
import {
  acquiredValue,
  isStageCleared,
  isStageUnlocked,
  parseProgress,
  serializeProgress,
  stageStars,
} from './stage';
import type { RoundRecord, StageDef } from './types';

function record(
  roundIndex: number,
  winnerId: string | null,
  itemValue: number,
  winnersCurse = false,
): RoundRecord {
  return {
    roundIndex,
    auctionType: 'sealed-first',
    itemId: `item-${roundIndex}`,
    itemName: '은촛대',
    itemEmoji: '🕯️',
    itemValue,
    winnerId,
    price: 0,
    profit: 0,
    winnersCurse,
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

describe('stageStars', () => {
  const win = record(0, 'player', 1500); // 클리어 확정용

  it('클리어 못 하면 0', () => {
    expect(stageStars(stage, [record(0, 'ai', 1500)], 'player', 3000)).toBe(0);
  });

  it('클리어만 하면 ★ (예산 부족 + 저주)', () => {
    const cursed = { ...win, winnersCurse: true };
    expect(stageStars(stage, [cursed], 'player', 100)).toBe(1); // 예산 100 < 600(20%)
  });

  it('예산 20% 이상 남기면 +★', () => {
    const cursed = { ...win, winnersCurse: true };
    expect(stageStars(stage, [cursed], 'player', 600)).toBe(2); // 경계 포함
  });

  it('승자의 저주 0회면 +★ — 전부 만족 시 ★★★', () => {
    expect(stageStars(stage, [win], 'player', 600)).toBe(3);
    expect(stageStars(stage, [win], 'player', 100)).toBe(2); // 저주 0 + 예산 부족
  });
});

describe('언락·진행 저장', () => {
  it('스테이지 1은 항상 열려 있고, 이후는 직전 ★ 이상이어야 열린다', () => {
    expect(isStageUnlocked(1, {})).toBe(true);
    expect(isStageUnlocked(2, {})).toBe(false);
    expect(isStageUnlocked(2, { 1: 1 })).toBe(true);
    expect(isStageUnlocked(8, { 7: 3 })).toBe(true);
  });

  it('내보낸 진행을 다시 불러오면 같다 (왕복)', () => {
    const progress = { 1: 3, 2: 1, 5: 2 };
    expect(parseProgress(serializeProgress(progress))).toEqual(progress);
  });

  it('형식이 어긋나면 null', () => {
    expect(parseProgress('잘못된 JSON')).toBeNull();
    expect(parseProgress('{"game":"other","version":1,"progress":{}}')).toBeNull();
    expect(parseProgress('{"game":"winners-curse","version":1,"progress":{"1":9}}')).toBeNull();
    expect(parseProgress('{"game":"winners-curse","version":1,"progress":{"x":1}}')).toBeNull();
  });
});
