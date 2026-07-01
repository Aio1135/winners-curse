// 공용 타입 정의. engine/은 React를 import하지 않는다.

export type AuctionType = 'english' | 'dutch' | 'sealed-first' | 'sealed-second';

/** 진짜 가치 V의 생성 범위 (정수, 양끝 포함) */
export interface ValueRange {
  min: number;
  max: number;
}

export interface Item {
  id: string;
  name: string;
  emoji: string;
  /** 진짜 가치 V. SETTLE 전에는 UI에 절대 노출하지 않는다 */
  value: number;
}

/** 감정치 s = V × (1 + ε), ε ~ Uniform(−σ, +σ) */
export interface Appraisal {
  value: number;
  /** 이 감정치가 뽑힌 오차 폭 — UI에 "감정치 800 (오차 ±30%)" 형태로 표기 */
  sigma: number;
}

/** 제출된 입찰. 0 = 불참 */
export interface PlacedBid {
  id: string;
  bid: number;
}

/** 지난 라운드의 공개 기록. AI가 볼 수 있는 정보는 이것뿐 */
export interface RoundRecord {
  roundIndex: number;
  auctionType: AuctionType;
  itemId: string;
  itemValue: number;
  /** null = 유찰 */
  winnerId: string | null;
  price: number;
  /** V − 낙찰가. 유찰이면 0 */
  profit: number;
  /** 승자의 저주 = 낙찰했는데 손익 < 0 */
  winnersCurse: boolean;
  /** 복기에서 공개된 전원의 입찰액 */
  bids: PlacedBid[];
}

export type BidderKind = 'honest' | 'bulldozer' | 'miser' | 'sniper' | 'cartel';

/** 스테이지에 배치되는 AI 한 명 */
export interface BidderSpec {
  kind: BidderKind;
  /** 같은 성격이 여럿일 때도 유일해야 한다 (예: honest-1, honest-2) */
  id: string;
  /** 표시 이름 재정의 (같은 성격 구분용) */
  name?: string;
}

export interface StageDef {
  id: number;
  title: string;
  /** 'mixed' = 라운드마다 방식 랜덤 (스테이지 8) */
  auctionType: AuctionType | 'mixed';
  rounds: number;
  budget: number;
  coins: number;
  sigma: number;
  valueRange: ValueRange;
  /** 클리어 조건: 확보한 진짜 가치 합계 ≥ targetValue */
  targetValue: number;
  bidders: BidderSpec[];
}
