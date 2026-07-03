// 공용 타입 정의. engine/은 React를 import하지 않는다.

export type AuctionType = 'english' | 'dutch' | 'sealed-first' | 'sealed-second';

/** 진짜 가치 V의 생성 범위 (정수, 양끝 포함) */
export interface ValueRange {
  min: number;
  max: number;
}

/** 아이템 카테고리. ROUND_INTRO에서 공개되는 정보 — AI 선호 시스템의 기준 */
export type ItemCategory = 'timepiece' | 'art' | 'antique' | 'collectible';

export interface Item {
  id: string;
  name: string;
  emoji: string;
  category: ItemCategory;
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
  /** 네덜란드식이었다면 이 라운드의 하강 스텝 (복기 틱 계산용) */
  dutchStep?: number;
}

export type BidderKind = 'honest' | 'bulldozer' | 'miser' | 'sniper' | 'cartel';

/** 스테이지에 배치되는 AI 한 명 */
export interface BidderSpec {
  kind: BidderKind;
  /** 같은 성격이 여럿일 때도 유일해야 한다 (예: honest-1, honest-2) */
  id: string;
  /** 표시 이름 재정의 (같은 성격 구분용) */
  name?: string;
  /** 선호 카테고리: 해당 아이템에 더 공격적으로 입찰. 브리핑에 힌트 노출 */
  preferredCategory?: ItemCategory;
  /** cartel 전용: 담합 파트너의 id. 서로를 가리켜야 한다 */
  partnerId?: string;
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
  /** 네덜란드식 하강 스텝을 라운드마다 이 범위에서 추첨 (스테이지 7 특이 조건) */
  dutchStepRange?: { min: number; max: number };
  bidders: BidderSpec[];
}
