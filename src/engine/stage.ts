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

// TODO(D6): 별점 판정 (★ 클리어 / ★★ 예산 20% 잔여 / ★★★ 저주 0회)
