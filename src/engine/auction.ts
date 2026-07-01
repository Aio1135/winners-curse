import type { Rng } from './rng';
import type { AuctionType, PlacedBid } from './types';

/** 참가 계획. 방식별 행동은 엔진이 wtp에서 파생한다 */
export interface AuctionEntry {
  id: string;
  /** 최대지불의사. 정수가 아니어도 되고, 엔진이 정수 입찰액으로 변환 */
  wtp: number;
  /** 남은 예산. 입찰액은 예산을 넘을 수 없다 */
  budget: number;
}

export interface AuctionResult {
  auctionType: AuctionType;
  bids: PlacedBid[];
  /** null = 유찰 */
  winnerId: string | null;
  price: number;
}

/** wtp → 실제 입찰액: 정수 내림, 예산 초과·음수 금지. 0 = 불참 */
function toBid(entry: AuctionEntry): PlacedBid {
  return {
    id: entry.id,
    bid: Math.max(0, Math.min(Math.floor(entry.wtp), Math.floor(entry.budget))),
  };
}

/** 최고가 결정. 동점 시 시드 RNG로 무작위. 전원 불참이면 null */
function pickWinner(bids: PlacedBid[], rng: Rng): PlacedBid | null {
  const top = Math.max(...bids.map((b) => b.bid), 0);
  if (top <= 0) return null;
  const tied = bids.filter((b) => b.bid === top);
  return tied.length === 1 ? tied[0] : rng.pick(tied);
}

export function runAuction(
  auctionType: AuctionType,
  entries: AuctionEntry[],
  rng: Rng,
): AuctionResult {
  switch (auctionType) {
    case 'sealed-first':
    case 'sealed-second':
      return runSealed(auctionType, entries, rng);
    default:
      // TODO(D3): english/dutch 실시간 방식
      throw new Error(`${auctionType} 방식은 아직 구현되지 않았다`);
  }
}

function runSealed(
  auctionType: 'sealed-first' | 'sealed-second',
  entries: AuctionEntry[],
  rng: Rng,
): AuctionResult {
  const bids = entries.map(toBid);
  const winner = pickWinner(bids, rng);
  if (winner === null) {
    return { auctionType, bids, winnerId: null, price: 0 };
  }
  // 1가: 자기 입찰액 지불. 2가(Vickrey): 자신을 뺀 최고가 지불 (경쟁자가 없으면 0)
  const price =
    auctionType === 'sealed-first'
      ? winner.bid
      : Math.max(...bids.filter((b) => b !== winner).map((b) => b.bid), 0);
  return { auctionType, bids, winnerId: winner.id, price };
}
