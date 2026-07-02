import type { Rng } from './rng';
import type { AuctionType, PlacedBid, ValueRange } from './types';

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

/** 실제 지불 가능한 상한: 정수 내림, 예산 초과·음수 금지 */
function effectiveCap(entry: AuctionEntry): number {
  return Math.max(0, Math.min(Math.floor(entry.wtp), Math.floor(entry.budget)));
}

// ──────────────────────────── 봉투 방식 (턴제) ────────────────────────────

/** wtp → 실제 입찰액. 0 = 불참 */
function toBid(entry: AuctionEntry): PlacedBid {
  return { id: entry.id, bid: effectiveCap(entry) };
}

/** 최고가 결정. 동점 시 시드 RNG로 무작위. 전원 불참이면 null */
function pickWinner(bids: PlacedBid[], rng: Rng): PlacedBid | null {
  const top = Math.max(...bids.map((b) => b.bid), 0);
  if (top <= 0) return null;
  const tied = bids.filter((b) => b.bid === top);
  return tied.length === 1 ? tied[0] : rng.pick(tied);
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

// ──────────────────────────── 영국식 (공개 상승, 실시간) ────────────────────────────
// 틱 속도·스텝은 게임필 수치 — 사람 확인 후 조정 (CLAUDE.md §5.1)

export const ENGLISH_TICK_MS = 800;
export const ENGLISH_STEP = 0.05;
export const ENGLISH_START_RATIO = 0.5;

export interface EnglishState {
  auctionType: 'english';
  /** 현재 호가 */
  price: number;
  activeIds: string[];
  /** 탈락 기록. bid = 따라가지 못한 호가 (시작가부터 불참 = 0) */
  drops: PlacedBid[];
  tickCount: number;
  finished: boolean;
  winnerId: string | null;
  finalPrice: number;
}

/** 시작가 = V 생성 범위 하한의 50%. 시작가를 못 내는 참가자는 불참 */
export function startEnglish(entries: AuctionEntry[], range: ValueRange): EnglishState {
  const startPrice = Math.floor(range.min * ENGLISH_START_RATIO);
  const activeIds: string[] = [];
  const drops: PlacedBid[] = [];
  for (const entry of entries) {
    if (effectiveCap(entry) >= startPrice) activeIds.push(entry.id);
    else drops.push({ id: entry.id, bid: 0 });
  }
  const base: EnglishState = {
    auctionType: 'english',
    price: startPrice,
    activeIds,
    drops,
    tickCount: 0,
    finished: false,
    winnerId: null,
    finalPrice: 0,
  };
  if (activeIds.length === 0) return { ...base, finished: true };
  if (activeIds.length === 1) {
    return { ...base, finished: true, winnerId: activeIds[0], finalPrice: startPrice };
  }
  return base;
}

/**
 * 호가 5% 상승 → 새 호가를 못 따라가는 참가자 탈락.
 * 1인 남으면 그 호가에 낙찰. 전원 동시 탈락이면 직전 호가에서 RNG로 낙찰.
 */
export function tickEnglish(
  state: EnglishState,
  entries: AuctionEntry[],
  rng: Rng,
): EnglishState {
  if (state.finished) return state;
  const newPrice = Math.ceil(state.price * (1 + ENGLISH_STEP));
  const caps = new Map(entries.map((e) => [e.id, effectiveCap(e)]));
  const stay: string[] = [];
  const dropNow: string[] = [];
  for (const id of state.activeIds) {
    ((caps.get(id) ?? 0) >= newPrice ? stay : dropNow).push(id);
  }
  const next: EnglishState = {
    ...state,
    price: newPrice,
    activeIds: stay,
    drops: [...state.drops, ...dropNow.map((id) => ({ id, bid: newPrice }))],
    tickCount: state.tickCount + 1,
  };
  if (stay.length >= 2) return next;
  if (stay.length === 1) {
    return { ...next, finished: true, winnerId: stay[0], finalPrice: newPrice };
  }
  // 전원 동시 탈락 → 직전 호가는 전원이 받아들였으므로 그 호가에서 무작위 낙찰
  const winnerId = rng.pick(dropNow);
  return {
    ...next,
    price: state.price,
    drops: next.drops.filter((d) => d.id !== winnerId),
    finished: true,
    winnerId,
    finalPrice: state.price,
  };
}

/** 자발적 탈락 (플레이어 "포기" 버튼) */
export function dropFromEnglish(state: EnglishState, id: string): EnglishState {
  if (state.finished || !state.activeIds.includes(id)) return state;
  const activeIds = state.activeIds.filter((a) => a !== id);
  const drops = [...state.drops, { id, bid: state.price }];
  if (activeIds.length === 1) {
    return {
      ...state,
      activeIds,
      drops,
      finished: true,
      winnerId: activeIds[0],
      finalPrice: state.price,
    };
  }
  if (activeIds.length === 0) {
    return { ...state, activeIds, drops, finished: true };
  }
  return { ...state, activeIds, drops };
}

export function englishResult(state: EnglishState): AuctionResult {
  if (!state.finished) throw new Error('경매가 아직 끝나지 않았다');
  const bids = [...state.drops];
  if (state.winnerId !== null) bids.push({ id: state.winnerId, bid: state.finalPrice });
  return {
    auctionType: 'english',
    bids,
    winnerId: state.winnerId,
    price: state.winnerId === null ? 0 : state.finalPrice,
  };
}

// ──────────────────────────── 네덜란드식 (공개 하강, 실시간) ────────────────────────────

export const DUTCH_TICK_MS = 700;
export const DUTCH_STEP = 0.03;
export const DUTCH_START_RATIO = 1.5;
export const DUTCH_FLOOR_RATIO = 0.2;

export interface DutchState {
  auctionType: 'dutch';
  price: number;
  startPrice: number;
  /** 하한 = V 범위 상한의 20%. 도달 시 유찰 */
  floor: number;
  tickCount: number;
  finished: boolean;
  winnerId: string | null;
  finalPrice: number;
}

/** 현재 가격 이상을 낼 참가자(AI)가 있으면 즉시 낙찰. 동시 도달은 RNG */
function checkDutchTriggers(
  state: DutchState,
  entries: AuctionEntry[],
  rng: Rng,
): DutchState {
  const ready = entries.filter((e) => effectiveCap(e) >= state.price);
  if (ready.length === 0) return state;
  const winner = ready.length === 1 ? ready[0] : rng.pick(ready);
  return { ...state, finished: true, winnerId: winner.id, finalPrice: state.price };
}

/** 시작가 = V 생성 범위 상한의 150%. entries에는 자동 트리거 참가자(AI)만 넣는다 */
export function startDutch(entries: AuctionEntry[], range: ValueRange, rng: Rng): DutchState {
  const startPrice = Math.floor(range.max * DUTCH_START_RATIO);
  const base: DutchState = {
    auctionType: 'dutch',
    price: startPrice,
    startPrice,
    floor: Math.floor(range.max * DUTCH_FLOOR_RATIO),
    tickCount: 0,
    finished: false,
    winnerId: null,
    finalPrice: 0,
  };
  return checkDutchTriggers(base, entries, rng);
}

/** 가격 3% 하강 → 목표가 도달한 AI가 즉시 낙찰. 하한 도달 시 유찰 */
export function tickDutch(state: DutchState, entries: AuctionEntry[], rng: Rng): DutchState {
  if (state.finished) return state;
  const dropped = Math.floor(state.price * (1 - DUTCH_STEP));
  const newPrice = Math.max(state.floor, dropped);
  const next = { ...state, price: newPrice, tickCount: state.tickCount + 1 };
  const triggered = checkDutchTriggers(next, entries, rng);
  if (triggered.finished) return triggered;
  if (newPrice <= state.floor) return { ...next, finished: true }; // 유찰
  return next;
}

/** 플레이어 "낙찰" 버튼. 예산이 모자라면 무시 */
export function claimDutch(state: DutchState, id: string, budget: number): DutchState {
  if (state.finished || budget < state.price) return state;
  return { ...state, finished: true, winnerId: id, finalPrice: state.price };
}

/** 복기 기록: 낙찰자는 낙찰가, 나머지 AI는 목표가(한도) 공개. 플레이어 미클릭 = 0 */
export function dutchResult(state: DutchState, aiEntries: AuctionEntry[]): AuctionResult {
  if (!state.finished) throw new Error('경매가 아직 끝나지 않았다');
  const bids: PlacedBid[] = aiEntries.map((e) => ({
    id: e.id,
    bid: e.id === state.winnerId ? state.finalPrice : effectiveCap(e),
  }));
  if (state.winnerId !== null && !aiEntries.some((e) => e.id === state.winnerId)) {
    bids.push({ id: state.winnerId, bid: state.finalPrice });
  }
  return {
    auctionType: 'dutch',
    bids,
    winnerId: state.winnerId,
    price: state.winnerId === null ? 0 : state.finalPrice,
  };
}

// ──────────────────────────── 공통 진입점 ────────────────────────────

/**
 * 4개 방식의 판정 로직. 실시간 방식(english/dutch)은 완주까지 시뮬레이션한다
 * (플레이어 없이 AI끼리 진행되는 패스 라운드용. 인터랙티브 진행은 start/tick 함수 사용).
 */
export function runAuction(
  auctionType: AuctionType,
  entries: AuctionEntry[],
  rng: Rng,
  valueRange?: ValueRange,
): AuctionResult {
  switch (auctionType) {
    case 'sealed-first':
    case 'sealed-second':
      return runSealed(auctionType, entries, rng);
    case 'english': {
      if (valueRange === undefined) throw new Error('영국식 경매에는 valueRange가 필요하다');
      let state = startEnglish(entries, valueRange);
      while (!state.finished) state = tickEnglish(state, entries, rng);
      return englishResult(state);
    }
    case 'dutch': {
      if (valueRange === undefined) throw new Error('네덜란드식 경매에는 valueRange가 필요하다');
      let state = startDutch(entries, valueRange, rng);
      while (!state.finished) state = tickDutch(state, entries, rng);
      return dutchResult(state, entries);
    }
  }
}
