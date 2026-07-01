import type { Rng } from '../engine/rng';
import type { AuctionType, ItemCategory, RoundRecord } from '../engine/types';

// AI가 아는 것 = 자기 감정치, 공개 호가, 아이템 카테고리, 지난 라운드의 공개 기록뿐.
// 플레이어의 감정치나 입력을 절대 훔쳐보지 않는다 (공정성).
export interface BidderContext {
  /** 자신의 감정치 */
  appraisal: number;
  /** 남은 예산 */
  budget: number;
  auctionType: AuctionType;
  /** 이번 아이템 카테고리 (공개 정보) */
  itemCategory: ItemCategory;
  roundIndex: number;
  totalRounds: number;
  /** 지난 라운드 공개 정보 */
  history: RoundRecord[];
  rng: Rng;
}

/** 방식별 행동은 엔진이 wtp에서 파생한다 */
export interface BidderPlan {
  wtp: number;
}

/** 복기 대사 작성에 필요한 라운드 결과 */
export interface BidderOutcome {
  won: boolean;
  /** 자신이 제출한 입찰액 (0 = 불참) */
  bid: number;
  winnerId: string | null;
  price: number;
  itemValue: number;
}

export interface Bidder {
  id: string;
  name: string;
  emoji: string;
  /** 브리핑 화면 한 줄 소개 (성격 힌트) */
  tagline: string;
  decide(ctx: BidderContext): BidderPlan;
  /** 복기 대사. 반드시 자기 로직을 정직하게 설명한다 */
  reviewLine(ctx: BidderContext, outcome: BidderOutcome): string;
}
