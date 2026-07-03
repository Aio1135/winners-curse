import { describe, expect, it } from 'vitest';
import { STAGES, TOTAL_STAGE_SLOTS, getStage } from './stages';

describe('스테이지 데이터 정합성', () => {
  it('커리큘럼 8개가 전부 정의되어 있다', () => {
    expect(STAGES).toHaveLength(TOTAL_STAGE_SLOTS);
    for (let id = 1; id <= TOTAL_STAGE_SLOTS; id += 1) {
      expect(getStage(id)?.id).toBe(id);
    }
  });

  it('참가 AI는 2~4명이고 id가 유일하다', () => {
    for (const stage of STAGES) {
      expect(stage.bidders.length).toBeGreaterThanOrEqual(1);
      expect(stage.bidders.length).toBeLessThanOrEqual(4);
      const ids = stage.bidders.map((b) => b.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('cartel은 항상 짝을 이루고 서로를 가리킨다', () => {
    for (const stage of STAGES) {
      for (const spec of stage.bidders) {
        if (spec.kind !== 'cartel') continue;
        expect(spec.partnerId).toBeDefined();
        const partner = stage.bidders.find((b) => b.id === spec.partnerId);
        expect(partner?.kind).toBe('cartel');
        expect(partner?.partnerId).toBe(spec.id);
      }
    }
  });

  it('수치가 말이 된다 (양수 예산·목표·정상 범위·σ)', () => {
    for (const stage of STAGES) {
      expect(stage.budget).toBeGreaterThan(0);
      expect(stage.targetValue).toBeGreaterThan(0);
      expect(stage.rounds).toBeGreaterThan(0);
      expect(stage.valueRange.min).toBeGreaterThan(0);
      expect(stage.valueRange.max).toBeGreaterThan(stage.valueRange.min);
      expect(stage.sigma).toBeGreaterThanOrEqual(0);
      expect(stage.sigma).toBeLessThan(1);
      if (stage.dutchStepRange !== undefined) {
        expect(stage.dutchStepRange.min).toBeGreaterThan(0);
        expect(stage.dutchStepRange.max).toBeGreaterThanOrEqual(stage.dutchStepRange.min);
      }
    }
  });

  it('커리큘럼 §7과 방식·라운드 수가 일치한다', () => {
    expect(getStage(1)).toMatchObject({ auctionType: 'english', rounds: 3 });
    expect(getStage(2)).toMatchObject({ auctionType: 'sealed-first', rounds: 4 });
    expect(getStage(3)).toMatchObject({ auctionType: 'sealed-second', rounds: 4 });
    expect(getStage(4)).toMatchObject({ auctionType: 'dutch', rounds: 4 });
    expect(getStage(5)).toMatchObject({ auctionType: 'sealed-first', rounds: 5, sigma: 0.4 });
    expect(getStage(6)).toMatchObject({ auctionType: 'english', rounds: 5 });
    expect(getStage(7)).toMatchObject({ auctionType: 'dutch', rounds: 5 });
    expect(getStage(8)).toMatchObject({ auctionType: 'mixed', rounds: 6, coins: 3 });
  });
});
