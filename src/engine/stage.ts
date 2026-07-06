import type { RoundRecord, StageDef } from './types';

/** 확보한 진짜 가치 합계 */
export function acquiredValue(history: RoundRecord[], participantId: string): number {
  return history
    .filter((r) => r.winnerId === participantId)
    .reduce((sum, r) => sum + r.itemValue, 0);
}

/** 클리어 조건: 확보한 진짜 가치 합계 ≥ 목표치 */
export function isStageCleared(
  stage: StageDef,
  history: RoundRecord[],
  playerId: string,
): boolean {
  return acquiredValue(history, playerId) >= stage.targetValue;
}

/**
 * 별점 (누적 가산): 클리어 못 하면 0.
 * ★ 클리어 / +★ 예산 20% 이상 잔여 / +★ 승자의 저주 0회
 */
export function stageStars(
  stage: StageDef,
  history: RoundRecord[],
  playerId: string,
  budgetLeft: number,
): number {
  if (!isStageCleared(stage, history, playerId)) return 0;
  let stars = 1;
  if (budgetLeft >= stage.budget * 0.2) stars += 1;
  if (!history.some((r) => r.winnerId === playerId && r.winnersCurse)) stars += 1;
  return stars;
}

/** 스테이지별 최고 별점. 언락 조건: 이전 스테이지 ★ 이상 */
export type ProgressMap = Record<number, number>;

export function isStageUnlocked(stageId: number, progress: ProgressMap): boolean {
  return stageId === 1 || (progress[stageId - 1] ?? 0) >= 1;
}

/** 진행 내보내기 — 저장은 메모리 상태 + JSON 파일만 (localStorage 금지) */
export function serializeProgress(progress: ProgressMap): string {
  return JSON.stringify({ game: 'winners-curse', version: 1, progress }, null, 2);
}

/** 진행 불러오기. 형식이 어긋나면 null */
export function parseProgress(text: string): ProgressMap | null {
  try {
    const data: unknown = JSON.parse(text);
    if (typeof data !== 'object' || data === null) return null;
    const file = data as Record<string, unknown>;
    if (file.game !== 'winners-curse' || file.version !== 1) return null;
    if (typeof file.progress !== 'object' || file.progress === null) return null;
    const result: ProgressMap = {};
    for (const [key, value] of Object.entries(file.progress as Record<string, unknown>)) {
      const id = Number(key);
      if (!Number.isInteger(id) || id < 1) return null;
      if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 3) {
        return null;
      }
      result[id] = value;
    }
    return result;
  } catch {
    return null;
  }
}
