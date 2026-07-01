import { describe, expect, it } from 'vitest';
import { createRng, seedFromString } from './rng';

describe('createRng', () => {
  it('같은 시드는 같은 수열을 만든다', () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 20; i += 1) {
      expect(a.next()).toBe(b.next());
    }
  });

  it('다른 시드는 다른 수열을 만든다', () => {
    const a = createRng(1);
    const b = createRng(2);
    const seqA = Array.from({ length: 10 }, () => a.next());
    const seqB = Array.from({ length: 10 }, () => b.next());
    expect(seqA).not.toEqual(seqB);
  });

  it('next()는 [0, 1) 범위를 벗어나지 않는다', () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i += 1) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('int()는 양끝 포함 정수를 반환하고 경계값도 나온다', () => {
    const rng = createRng(3);
    const seen = new Set<number>();
    for (let i = 0; i < 1000; i += 1) {
      const v = rng.int(1, 3);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(3);
      seen.add(v);
    }
    expect(seen).toEqual(new Set([1, 2, 3]));
  });

  it('int(n, n)은 n을 반환한다', () => {
    const rng = createRng(5);
    expect(rng.int(10, 10)).toBe(10);
  });

  it('int()는 잘못된 범위에서 던진다', () => {
    const rng = createRng(5);
    expect(() => rng.int(3, 1)).toThrow();
  });

  it('shuffle()은 원소를 보존하고 원본을 변경하지 않는다', () => {
    const rng = createRng(9);
    const original = [1, 2, 3, 4, 5];
    const shuffled = rng.shuffle(original);
    expect(original).toEqual([1, 2, 3, 4, 5]);
    expect([...shuffled].sort((x, y) => x - y)).toEqual([1, 2, 3, 4, 5]);
  });

  it('pick()은 빈 배열에서 던진다', () => {
    const rng = createRng(11);
    expect(() => rng.pick([])).toThrow();
  });
});

describe('seedFromString', () => {
  it('같은 문자열은 같은 시드를 만든다', () => {
    expect(seedFromString('낙찰왕')).toBe(seedFromString('낙찰왕'));
  });

  it('다른 문자열은 다른 시드를 만든다', () => {
    expect(seedFromString('stage-1')).not.toBe(seedFromString('stage-2'));
  });
});
