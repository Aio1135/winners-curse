import { useGame } from '../state/GameContext';
import { formatMoney, TEXT } from '../text';
import type { GamePhase } from '../state/gameReducer';

// D1 골격: 상태 머신을 끝까지 클릭으로 통과할 수 있는 임시 화면.
// D2~D3에서 방식별 BidPanel·정산·복기 화면으로 분리한다.
export default function AuctionRoom() {
  const { state, dispatch } = useGame();
  const phaseLabel = TEXT.phase[state.phase as Exclude<GamePhase, 'STAGE_SELECT' | 'BRIEFING'>];

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 p-6">
      <header className="flex w-full items-center justify-between text-sm text-slate-400">
        <span>{TEXT.auctionRoom.round(state.roundIndex + 1, state.totalRounds)}</span>
        <span>
          {TEXT.auctionRoom.budget} {formatMoney(state.budget)} · {TEXT.auctionRoom.coins}{' '}
          {state.coins}
        </span>
      </header>

      <div className="w-full rounded-xl border border-slate-700 bg-slate-800 p-8 text-center">
        <div className="text-3xl">🔨</div>
        <h1 className="mt-2 text-2xl font-bold">{phaseLabel}</h1>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {state.phase === 'ROUND_INTRO' && (
          <ActionButton onClick={() => dispatch({ type: 'CONFIRM_ITEM' })}>
            {TEXT.auctionRoom.confirmItem}
          </ActionButton>
        )}

        {state.phase === 'JUDGEMENT' && (
          <>
            <ActionButton
              onClick={() => dispatch({ type: 'REQUEST_APPRAISAL' })}
              disabled={state.coins <= 0 || state.appraisalUsed}
            >
              {TEXT.auctionRoom.requestAppraisal}
            </ActionButton>
            <ActionButton onClick={() => dispatch({ type: 'PASS_ROUND' })}>
              {TEXT.auctionRoom.pass}
            </ActionButton>
            <ActionButton onClick={() => dispatch({ type: 'ENTER_BIDDING' })} primary>
              {TEXT.auctionRoom.enterBidding}
            </ActionButton>
          </>
        )}

        {state.phase === 'BIDDING' && (
          <>
            <ActionButton onClick={() => dispatch({ type: 'PLAYER_DROP' })}>
              {TEXT.auctionRoom.drop}
            </ActionButton>
            <ActionButton onClick={() => dispatch({ type: 'PLAYER_BID', amount: 0 })} primary>
              {TEXT.auctionRoom.placeBid}
            </ActionButton>
          </>
        )}

        {state.phase === 'SETTLE' && (
          <ActionButton onClick={() => dispatch({ type: 'OPEN_REVIEW' })} primary>
            {TEXT.auctionRoom.openReview}
          </ActionButton>
        )}

        {state.phase === 'REVIEW' && (
          <ActionButton onClick={() => dispatch({ type: 'NEXT_ROUND' })} primary>
            {state.roundIndex + 1 >= state.totalRounds
              ? TEXT.auctionRoom.toResult
              : TEXT.auctionRoom.nextRound}
          </ActionButton>
        )}

        {state.phase === 'RESULT' && (
          <ActionButton onClick={() => dispatch({ type: 'EXIT_STAGE' })} primary>
            {TEXT.auctionRoom.exit}
          </ActionButton>
        )}
      </div>

      {state.phase !== 'RESULT' && (
        <button
          type="button"
          onClick={() => dispatch({ type: 'EXIT_STAGE' })}
          className="text-sm text-slate-500 underline-offset-4 hover:underline"
        >
          {TEXT.auctionRoom.exit}
        </button>
      )}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  primary = false,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        primary
          ? 'rounded-lg bg-amber-500 px-5 py-2 font-semibold text-slate-900 transition hover:bg-amber-400 disabled:opacity-40'
          : 'rounded-lg border border-slate-600 px-5 py-2 text-slate-300 transition hover:bg-slate-800 disabled:opacity-40'
      }
    >
      {children}
    </button>
  );
}
