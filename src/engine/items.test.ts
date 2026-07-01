import { describe, expect, it } from 'vitest';
import { appraise, generateItem } from './items';
import { createRng } from './rng';

describe('generateItem', () => {
  it('진짜 가치 V는 범위 내 정수다', () => {
    const rng = createRng(1);
    for (let i = 0; i < 200; i += 1) {
      const item = generateItem(i, { min: 500, max: 1500 }, rng);
      expect(Number.isInteger(item.value)).toBe(true);
      expect(item.value).toBeGreaterThanOrEqual(500);
      expect(item.value).toBeLessThanOrEqual(1500);
    }
  });

  it('모든 아이템은 4개 카테고리 중 하나를 가진다', () => {
    const rng = createRng(5);
    for (let i = 0; i < 100; i += 1) {
      const item = generateItem(i, { min: 100, max: 900 }, rng);
      expect(['timepiece', 'art', 'antique', 'collectible']).toContain(item.category);
    }
  });

  it('같은 시드는 같은 아이템을 만든다', () => {
    const a = generateItem(0, { min: 100, max: 900 }, createRng(42));
    const b = generateItem(0, { min: 100, max: 900 }, createRng(42));
    expect(a).toEqual(b);
  });
});

describe('appraise', () => {
  it('감정치는 [V(1−σ), V(1+σ)] 범위의 정수다', () => {
    const rng = createRng(2);
    const value = 1000;
    const sigma = 0.3;
    for (let i = 0; i < 1000; i += 1) {
      const { value: s } = appraise(value, sigma, rng);
      expect(Number.isInteger(s)).toBe(true);
      expect(s).toBeGreaterThanOrEqual(Math.round(value * (1 - sigma)));
      expect(s).toBeLessThanOrEqual(Math.round(value * (1 + sigma)));
    }
  });

  it('σ = 0이면 감정치는 V와 같다', () => {
    const rng = createRng(3);
    expect(appraise(777, 0, rng).value).toBe(777);
  });

  it('표기용 sigma를 그대로 돌려준다', () => {
    const rng = createRng(4);
    expect(appraise(1000, 0.1, rng).sigma).toBe(0.1);
  });
});
