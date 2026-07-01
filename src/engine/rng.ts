// 시드 RNG (mulberry32) — 모든 랜덤의 단일 출처.
// 같은 시드 = 같은 게임 재현을 보장해야 하므로 Math.random() 직접 호출 금지.

export interface Rng {
  /** [0, 1) 범위 실수 */
  next(): number;
  /** [min, max] 양끝 포함 정수 */
  int(min: number, max: number): number;
  /** 배열에서 원소 1개 선택 */
  pick<T>(items: readonly T[]): T;
  /** 원본을 변경하지 않는 셔플 */
  shuffle<T>(items: readonly T[]): T[];
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number): number => {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new Error(`잘못된 정수 범위: [${min}, ${max}]`);
    }
    return min + Math.floor(next() * (max - min + 1));
  };

  const pick = <T,>(items: readonly T[]): T => {
    if (items.length === 0) throw new Error('빈 배열에서는 선택할 수 없다');
    return items[int(0, items.length - 1)];
  };

  const shuffle = <T,>(items: readonly T[]): T[] => {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = int(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  return { next, int, pick, shuffle };
}

/** 문자열 시드 → 32비트 정수 시드 (xmur3 해시) */
export function seedFromString(input: string): number {
  let h = 1779033703 ^ input.length;
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}
