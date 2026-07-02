import { createBidder } from '../../bidders';
import type { Bidder, BidderContext, BidderOutcome } from '../../bidders/types';
import {
  claimDutch,
  dropFromEnglish,
  dutchResult,
  englishResult,
  runAuction,
  startDutch,
  startEnglish,
  tickDutch,
  tickEnglish,
  type AuctionEntry,
  type AuctionResult,
  type DutchState,
  type EnglishState,
} from '../../engine/auction';
import { APPRAISAL_SIGMA, appraise, generateItem } from '../../engine/items';
import { createRng, seedFromString, type Rng } from '../../engine/rng';
import { buildReview, type ReviewData, type ReviewParticipantInput } from '../../engine/review';
import { settleRound } from '../../engine/settle';
import type { Appraisal, AuctionType, Item, RoundRecord, StageDef } from '../../engine/types';
import { getStage } from '../../stages/stages';
import { TEXT } from '../text';

export const PLAYER_ID = 'player';

// §3 게임 플로우 상태 머신. 화면 = 상태의 함수.
export type GamePhase =
  | 'STAGE_SELECT'
  | 'BRIEFING'
  | 'ROUND_INTRO'
  | 'JUDGEMENT'
  | 'BIDDING'
  | 'SETTLE'
  | 'REVIEW'
  | 'RESULT';

export interface RoundSetup {
  item: Item;
  playerAppraisal: Appraisal;
  /** REVIEW 전까지 UI 노출 금지 */
  aiAppraisals: Record<string, Appraisal>;
}

/** 실시간 경매(영국식/네덜란드식)의 진행 상태 */
export type LiveAuction = EnglishState | DutchState;

export interface GameState {
  phase: GamePhase;
  /** 스테이지 시작 시 고정. 같은 시드 = 같은 게임 재현 */
  seed: number;
  stage: StageDef | null;
  /** 0부터 시작 */
  roundIndex: number;
  /** 플레이어 남은 예산 */
  budget: number;
  coins: number;
  /** 이번 라운드 감정 의뢰 사용 여부 (라운드당 1회) */
  appraisalUsed: boolean;
  aiBudgets: Record<string, number>;
  round: RoundSetup | null;
  live: LiveAuction | null;
  /** 실시간 경매 틱에 쓰는 참가 계획 (영국식은 플레이어 포함, 네덜란드식은 AI만) */
  liveEntries: AuctionEntry[] | null;
  /** 직전 라운드의 정산·복기 데이터 (SETTLE/REVIEW 화면용) */
  review: ReviewData | null;
  history: RoundRecord[];
}

export type GameAction =
  | { type: 'SELECT_STAGE'; stageId: number }
  | { type: 'START_STAGE'; seed: number }
  | { type: 'CONFIRM_ITEM' }
  | { type: 'REQUEST_APPRAISAL' }
  | { type: 'PASS_ROUND' }
  | { type: 'ENTER_BIDDING' }
  | { type: 'PLAYER_BID'; amount: number }
  | { type: 'PLAYER_DROP' }
  | { type: 'TICK' }
  | { type: 'OPEN_REVIEW' }
  | { type: 'NEXT_ROUND' }
  | { type: 'EXIT_STAGE' };

export const initialState: GameState = {
  phase: 'STAGE_SELECT',
  seed: 1,
  stage: null,
  roundIndex: 0,
  budget: 0,
  coins: 0,
  appraisalUsed: false,
  aiBudgets: {},
  round: null,
  live: null,
  liveEntries: null,
  review: null,
  history: [],
};

/** 용도별 독립 RNG 파생 — 감정 재추첨이 다른 추첨에 영향을 주지 않게 한다 */
function deriveRng(seed: number, roundIndex: number, tag: string): Rng {
  return createRng(seedFromString(`${seed}:${roundIndex}:${tag}`));
}

function stageAuctionType(stage: StageDef): AuctionType {
  if (stage.auctionType === 'mixed') {
    throw new Error('mixed 방식은 아직 구현되지 않았다'); // TODO(D5)
  }
  return stage.auctionType;
}

/** 라운드 시작: 아이템 생성 + 전원 감정치 추첨 */
function setupRound(state: GameState, roundIndex: number): GameState {
  const stage = state.stage;
  if (stage === null) return state;
  const item = generateItem(roundIndex, stage.valueRange, deriveRng(state.seed, roundIndex, 'item'));
  const playerAppraisal = appraise(
    item.value,
    stage.sigma,
    deriveRng(state.seed, roundIndex, `appraise:${PLAYER_ID}`),
  );
  const aiAppraisals: Record<string, Appraisal> = {};
  for (const spec of stage.bidders) {
    aiAppraisals[spec.id] = appraise(
      item.value,
      stage.sigma,
      deriveRng(state.seed, roundIndex, `appraise:${spec.id}`),
    );
  }
  return {
    ...state,
    phase: 'ROUND_INTRO',
    roundIndex,
    appraisalUsed: false,
    round: { item, playerAppraisal, aiAppraisals },
    live: null,
    liveEntries: null,
    review: null,
  };
}

/** AI 입찰자 인스턴스·컨텍스트·참가 계획을 결정적으로 재구성한다 */
function buildAiPlans(state: GameState): {
  bidders: Bidder[];
  contexts: Record<string, BidderContext>;
  entries: AuctionEntry[];
} {
  const stage = state.stage;
  const round = state.round;
  if (stage === null || round === null) throw new Error('라운드가 준비되지 않았다');
  const auctionType = stageAuctionType(stage);
  const bidders = stage.bidders.map(createBidder);
  const contexts: Record<string, BidderContext> = {};
  const entries: AuctionEntry[] = [];
  for (const bidder of bidders) {
    const ctx: BidderContext = {
      appraisal: round.aiAppraisals[bidder.id].value,
      budget: state.aiBudgets[bidder.id] ?? 0,
      auctionType,
      itemCategory: round.item.category,
      roundIndex: state.roundIndex,
      totalRounds: stage.rounds,
      history: state.history,
      rng: deriveRng(state.seed, state.roundIndex, `decide:${bidder.id}`),
    };
    contexts[bidder.id] = ctx;
    entries.push({ id: bidder.id, wtp: bidder.decide(ctx).wtp, budget: ctx.budget });
  }
  return { bidders, contexts, entries };
}

/** 경매 결과 확정: 정산 → 예산 반영 → 복기 데이터 생성 → SETTLE */
function finishRound(state: GameState, auction: AuctionResult): GameState {
  const round = state.round;
  if (round === null) return state;
  const record = settleRound(state.roundIndex, round.item, auction);
  const { bidders, contexts } = buildAiPlans(state);

  const participants: ReviewParticipantInput[] = [
    {
      id: PLAYER_ID,
      name: TEXT.playerName,
      emoji: '🙂',
      appraisal: round.playerAppraisal.value,
      line: null,
    },
    ...bidders.map((bidder) => {
      const outcome: BidderOutcome = {
        won: auction.winnerId === bidder.id,
        bid: auction.bids.find((b) => b.id === bidder.id)?.bid ?? 0,
        winnerId: auction.winnerId,
        price: record.price,
        itemValue: round.item.value,
      };
      return {
        id: bidder.id,
        name: bidder.name,
        emoji: bidder.emoji,
        appraisal: round.aiAppraisals[bidder.id].value,
        line: bidder.reviewLine(contexts[bidder.id], outcome),
      };
    }),
  ];

  const aiBudgets = { ...state.aiBudgets };
  let budget = state.budget;
  if (auction.winnerId === PLAYER_ID) {
    budget -= record.price;
  } else if (auction.winnerId !== null) {
    aiBudgets[auction.winnerId] -= record.price;
  }

  return {
    ...state,
    phase: 'SETTLE',
    budget,
    aiBudgets,
    live: null,
    liveEntries: null,
    review: buildReview(record, participants),
    history: [...state.history, record],
  };
}

/** 봉투 방식 실행. playerBid 0 = 불참(패스 포함) */
function resolveSealed(state: GameState, playerBid: number): GameState {
  const stage = state.stage;
  if (stage === null) return state;
  const auctionType = stageAuctionType(stage);
  const { entries } = buildAiPlans(state);
  const auction = runAuction(
    auctionType,
    [{ id: PLAYER_ID, wtp: playerBid, budget: state.budget }, ...entries],
    deriveRng(state.seed, state.roundIndex, 'tie'),
  );
  return finishRound(state, auction);
}

/** 실시간 경매의 라이브 상태가 끝났으면 결과를 확정한다 */
function settleIfFinished(state: GameState, live: LiveAuction): GameState {
  if (!live.finished) return { ...state, live };
  if (live.auctionType === 'english') {
    return finishRound({ ...state, live }, englishResult(live));
  }
  const aiEntries = (state.liveEntries ?? []).filter((e) => e.id !== PLAYER_ID);
  return finishRound({ ...state, live }, dutchResult(live, aiEntries));
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SELECT_STAGE': {
      if (state.phase !== 'STAGE_SELECT') return state;
      const stage = getStage(action.stageId);
      if (stage === undefined) return state; // 미구현/잠김 스테이지
      return { ...state, phase: 'BRIEFING', stage };
    }

    case 'START_STAGE': {
      if (state.phase !== 'BRIEFING' || state.stage === null) return state;
      const aiBudgets: Record<string, number> = {};
      for (const spec of state.stage.bidders) {
        aiBudgets[spec.id] = state.stage.budget;
      }
      return setupRound(
        {
          ...state,
          seed: action.seed,
          budget: state.stage.budget,
          coins: state.stage.coins,
          aiBudgets,
          history: [],
        },
        0,
      );
    }

    case 'CONFIRM_ITEM': {
      if (state.phase !== 'ROUND_INTRO') return state;
      return { ...state, phase: 'JUDGEMENT' };
    }

    case 'REQUEST_APPRAISAL': {
      if (state.phase !== 'JUDGEMENT' || state.round === null) return state;
      if (state.coins <= 0 || state.appraisalUsed) return state;
      // 감정 의뢰: 코인 1개 소모 → σ = 0.1로 재추첨 (라운드당 1회)
      const playerAppraisal = appraise(
        state.round.item.value,
        APPRAISAL_SIGMA,
        deriveRng(state.seed, state.roundIndex, 'appraise:request'),
      );
      return {
        ...state,
        coins: state.coins - 1,
        appraisalUsed: true,
        round: { ...state.round, playerAppraisal },
      };
    }

    case 'PASS_ROUND': {
      if (state.phase !== 'JUDGEMENT' || state.stage === null) return state;
      const auctionType = stageAuctionType(state.stage);
      if (auctionType === 'sealed-first' || auctionType === 'sealed-second') {
        return resolveSealed(state, 0);
      }
      // 패스해도 AI끼리 실시간 경매는 (즉시 시뮬레이션으로) 진행된다
      const { entries } = buildAiPlans(state);
      const auction = runAuction(
        auctionType,
        entries,
        deriveRng(state.seed, state.roundIndex, 'rt-pass'),
        state.stage.valueRange,
      );
      return finishRound(state, auction);
    }

    case 'ENTER_BIDDING': {
      if (state.phase !== 'JUDGEMENT' || state.stage === null) return state;
      const auctionType = stageAuctionType(state.stage);
      if (auctionType === 'sealed-first' || auctionType === 'sealed-second') {
        return { ...state, phase: 'BIDDING' };
      }
      const { entries } = buildAiPlans(state);
      if (auctionType === 'english') {
        // 플레이어의 한도 = 예산. 탈락은 PLAYER_DROP으로만
        const liveEntries = [
          { id: PLAYER_ID, wtp: state.budget, budget: state.budget },
          ...entries,
        ];
        const live = startEnglish(liveEntries, state.stage.valueRange);
        const next = { ...state, phase: 'BIDDING' as const, liveEntries };
        return settleIfFinished(next, live);
      }
      // dutch: AI만 자동 트리거, 플레이어는 버튼으로 참여
      const live = startDutch(
        entries,
        state.stage.valueRange,
        deriveRng(state.seed, state.roundIndex, 'rt:0'),
      );
      const next = { ...state, phase: 'BIDDING' as const, liveEntries: entries };
      return settleIfFinished(next, live);
    }

    case 'PLAYER_BID': {
      if (state.phase !== 'BIDDING') return state;
      // 네덜란드식에서는 "낙찰" 버튼 — 현재 가격으로 즉시 종료
      if (state.live !== null && state.live.auctionType === 'dutch') {
        const live = claimDutch(state.live, PLAYER_ID, state.budget);
        return settleIfFinished(state, live);
      }
      if (state.live !== null) return state;
      const amount = Math.max(0, Math.min(Math.floor(action.amount), state.budget));
      return resolveSealed(state, amount);
    }

    case 'PLAYER_DROP': {
      if (state.phase !== 'BIDDING' || state.live === null) return state;
      if (state.live.auctionType !== 'english') return state;
      const live = dropFromEnglish(state.live, PLAYER_ID);
      return settleIfFinished(state, live);
    }

    case 'TICK': {
      if (state.phase !== 'BIDDING' || state.live === null || state.liveEntries === null) {
        return state;
      }
      const rng = deriveRng(state.seed, state.roundIndex, `rt:${state.live.tickCount + 1}`);
      const live =
        state.live.auctionType === 'english'
          ? tickEnglish(state.live, state.liveEntries, rng)
          : tickDutch(
              state.live,
              state.liveEntries.filter((e) => e.id !== PLAYER_ID),
              rng,
            );
      return settleIfFinished(state, live);
    }

    case 'OPEN_REVIEW': {
      if (state.phase !== 'SETTLE') return state;
      return { ...state, phase: 'REVIEW' };
    }

    case 'NEXT_ROUND': {
      if (state.phase !== 'REVIEW' || state.stage === null) return state;
      const next = state.roundIndex + 1;
      if (next >= state.stage.rounds) return { ...state, phase: 'RESULT' };
      return setupRound(state, next);
    }

    case 'EXIT_STAGE': {
      return { ...initialState, seed: state.seed };
    }

    default:
      return state;
  }
}
