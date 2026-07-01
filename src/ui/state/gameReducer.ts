import { createBidder } from '../../bidders';
import type { BidderContext, BidderOutcome } from '../../bidders/types';
import { runAuction, type AuctionEntry } from '../../engine/auction';
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
  review: null,
  history: [],
};

/** 용도별 독립 RNG 파생 — 감정 재추첨이 다른 추첨에 영향을 주지 않게 한다 */
function deriveRng(seed: number, roundIndex: number, tag: string): Rng {
  return createRng(seedFromString(`${seed}:${roundIndex}:${tag}`));
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
    review: null,
  };
}

/** 경매 실행 → 정산 → 복기 데이터 생성. playerBid 0 = 불참(패스 포함) */
function resolveRound(state: GameState, playerBid: number): GameState {
  const { stage, round } = state;
  if (stage === null || round === null) return state;
  if (stage.auctionType === 'mixed') {
    throw new Error('mixed 방식은 아직 구현되지 않았다'); // TODO(D5)
  }
  const auctionType: AuctionType = stage.auctionType;

  const bidders = stage.bidders.map(createBidder);
  const contexts: Record<string, BidderContext> = {};
  const entries: AuctionEntry[] = [{ id: PLAYER_ID, wtp: playerBid, budget: state.budget }];
  for (const bidder of bidders) {
    const ctx: BidderContext = {
      appraisal: round.aiAppraisals[bidder.id].value,
      budget: state.aiBudgets[bidder.id] ?? 0,
      auctionType,
      roundIndex: state.roundIndex,
      history: state.history,
      rng: deriveRng(state.seed, state.roundIndex, `decide:${bidder.id}`),
    };
    contexts[bidder.id] = ctx;
    entries.push({ id: bidder.id, wtp: bidder.decide(ctx).wtp, budget: ctx.budget });
  }

  const auction = runAuction(
    auctionType,
    entries,
    deriveRng(state.seed, state.roundIndex, 'tie'),
  );
  const record = settleRound(state.roundIndex, round.item, auction);

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
    review: buildReview(record, participants),
    history: [...state.history, record],
  };
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
      if (state.phase !== 'JUDGEMENT') return state;
      // 패스해도 AI끼리 경매는 진행된다
      return resolveRound(state, 0);
    }

    case 'ENTER_BIDDING': {
      if (state.phase !== 'JUDGEMENT') return state;
      return { ...state, phase: 'BIDDING' };
    }

    case 'PLAYER_BID': {
      if (state.phase !== 'BIDDING') return state;
      const amount = Math.max(0, Math.min(Math.floor(action.amount), state.budget));
      return resolveRound(state, amount);
    }

    case 'PLAYER_DROP': {
      if (state.phase !== 'BIDDING') return state;
      // TODO(D3): 실시간 방식(영국식)에서 탈락 처리. 봉투 방식에선 불참 제출과 같다
      return resolveRound(state, 0);
    }

    case 'TICK': {
      if (state.phase !== 'BIDDING') return state;
      // TODO(D3): 영국식/네덜란드식 호가 틱 진행
      return state;
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
