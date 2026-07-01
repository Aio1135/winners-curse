import type { RoundRecord } from '../../engine/types';

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

export interface GameState {
  phase: GamePhase;
  /** 스테이지 시작 시 고정. 같은 시드 = 같은 게임 재현 */
  seed: number;
  stageId: number | null;
  /** 0부터 시작 */
  roundIndex: number;
  totalRounds: number;
  budget: number;
  coins: number;
  /** 이번 라운드 감정 의뢰 사용 여부 (라운드당 1회) */
  appraisalUsed: boolean;
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
  stageId: null,
  roundIndex: 0,
  totalRounds: 0,
  budget: 0,
  coins: 0,
  appraisalUsed: false,
  history: [],
};

// D1 뼈대: 페이즈 전이만 구현. 경매 판정·정산·AI는 D2~D4에서 엔진 호출로 채운다.
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SELECT_STAGE': {
      if (state.phase !== 'STAGE_SELECT') return state;
      return { ...state, phase: 'BRIEFING', stageId: action.stageId };
    }

    case 'START_STAGE': {
      if (state.phase !== 'BRIEFING') return state;
      // TODO(D5): stages.ts에서 라운드 수·예산·코인을 읽어온다. 지금은 임시값.
      return {
        ...state,
        phase: 'ROUND_INTRO',
        seed: action.seed,
        roundIndex: 0,
        totalRounds: 3,
        budget: 3000,
        coins: 2,
        appraisalUsed: false,
        history: [],
      };
    }

    case 'CONFIRM_ITEM': {
      if (state.phase !== 'ROUND_INTRO') return state;
      return { ...state, phase: 'JUDGEMENT' };
    }

    case 'REQUEST_APPRAISAL': {
      if (state.phase !== 'JUDGEMENT') return state;
      if (state.coins <= 0 || state.appraisalUsed) return state;
      // TODO(D4): σ=0.1로 감정치 재추첨
      return { ...state, coins: state.coins - 1, appraisalUsed: true };
    }

    case 'PASS_ROUND': {
      if (state.phase !== 'JUDGEMENT') return state;
      // TODO(D2): 패스해도 AI끼리 경매는 진행되어야 한다
      return { ...state, phase: 'SETTLE' };
    }

    case 'ENTER_BIDDING': {
      if (state.phase !== 'JUDGEMENT') return state;
      return { ...state, phase: 'BIDDING' };
    }

    case 'PLAYER_BID': {
      if (state.phase !== 'BIDDING') return state;
      // TODO(D2): engine/auction.ts runAuction() 호출로 낙찰 판정
      return { ...state, phase: 'SETTLE' };
    }

    case 'PLAYER_DROP': {
      if (state.phase !== 'BIDDING') return state;
      // TODO(D3): 실시간 방식에서 플레이어 탈락 처리
      return { ...state, phase: 'SETTLE' };
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
      if (state.phase !== 'REVIEW') return state;
      const isLastRound = state.roundIndex + 1 >= state.totalRounds;
      if (isLastRound) return { ...state, phase: 'RESULT' };
      return {
        ...state,
        phase: 'ROUND_INTRO',
        roundIndex: state.roundIndex + 1,
        appraisalUsed: false,
      };
    }

    case 'EXIT_STAGE': {
      return { ...initialState, seed: state.seed };
    }

    default:
      return state;
  }
}
