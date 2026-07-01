import type { RoundRecord } from './types';

/** 복기 화면에 표시할 참가자 정보 (감정치는 여기서 처음 공개된다) */
export interface ReviewParticipantInput {
  id: string;
  name: string;
  emoji: string;
  appraisal: number;
  /** AI의 복기 대사. 플레이어는 null */
  line: string | null;
}

export interface ReviewEntry extends ReviewParticipantInput {
  bid: number;
  isWinner: boolean;
}

export interface ReviewData {
  itemValue: number;
  winnerId: string | null;
  price: number;
  entries: ReviewEntry[];
  /** 판별 피드백 문구 */
  feedback: string[];
}

/** 복기 v1: 전원의 감정치·입찰액·대사 공개. 판별 피드백은 D4에서 채운다 */
export function buildReview(
  record: RoundRecord,
  participants: ReviewParticipantInput[],
): ReviewData {
  const bidOf = new Map(record.bids.map((b) => [b.id, b.bid]));
  return {
    itemValue: record.itemValue,
    winnerId: record.winnerId,
    price: record.price,
    entries: participants.map((p) => ({
      ...p,
      bid: bidOf.get(p.id) ?? 0,
      isWinner: p.id === record.winnerId,
    })),
    // TODO(D4): Vickrey 정직 입찰 검증, 패스 라운드 요약, 승자의 저주 설명
    feedback: [],
  };
}
