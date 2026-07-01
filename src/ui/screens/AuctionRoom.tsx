import type { ReactNode } from 'react';
import type { ReviewData } from '../../engine/review';
import ItemCard from '../components/ItemCard';
import SealedBidPanel from '../components/SealedBidPanel';
import { useGame } from '../state/GameContext';
import { TEXT, formatMoney } from '../text';

// ROUND_INTRO → JUDGEMENT → BIDDING → SETTLE 구간을 담당하는 화면
export default function AuctionRoom() {
  const { state, dispatch } = useGame();
  const { stage, round, review } = state;
  if (stage === null || round === null) return null;

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 p-6">
      <header className="flex w-full items-center justify-between text-sm text-slate-400">
        <span>{TEXT.auctionRoom.round(state.roundIndex + 1, stage.rounds)}</span>
        <span>
          {TEXT.auctionRoom.budget} {formatMoney(state.budget)} · {TEXT.auctionRoom.coins}{' '}
          {state.coins}
        </span>
      </header>

      {state.phase !== 'SETTLE' && (
        <ItemCard
          item={round.item}
          appraisal={round.playerAppraisal}
          refreshed={state.appraisalUsed}
        />
      )}

      {state.phase === 'ROUND_INTRO' && (
        <ActionButton onClick={() => dispatch({ type: 'CONFIRM_ITEM' })} primary>
          {TEXT.auctionRoom.confirmItem}
        </ActionButton>
      )}

      {state.phase === 'JUDGEMENT' && (
        <div className="flex flex-wrap justify-center gap-3">
          <ActionButton
            onClick={() => dispatch({ type: 'REQUEST_APPRAISAL' })}
            disabled={state.coins <= 0 || state.appraisalUsed}
          >
            🔍 {TEXT.auctionRoom.requestAppraisal}
          </ActionButton>
          <ActionButton onClick={() => dispatch({ type: 'PASS_ROUND' })}>
            {TEXT.auctionRoom.pass}
          </ActionButton>
          <ActionButton onClick={() => dispatch({ type: 'ENTER_BIDDING' })} primary>
            {TEXT.auctionRoom.enterBidding}
          </ActionButton>
        </div>
      )}

      {state.phase === 'BIDDING' &&
        (stage.auctionType === 'sealed-first' || stage.auctionType === 'sealed-second') && (
          <SealedBidPanel
            auctionType={stage.auctionType}
            budget={state.budget}
            onSubmit={(amount) => dispatch({ type: 'PLAYER_BID', amount })}
          />
        )}

      {state.phase === 'SETTLE' && review !== null && (
        <SettlePanel
          review={review}
          onNext={() => dispatch({ type: 'OPEN_REVIEW' })}
        />
      )}

      <button
        type="button"
        onClick={() => dispatch({ type: 'EXIT_STAGE' })}
        className="text-sm text-slate-500 underline-offset-4 hover:underline"
      >
        {TEXT.auctionRoom.exit}
      </button>
    </div>
  );
}

function SettlePanel({
  review,
  onNext,
}: {
  review: ReviewData;
  onNext: () => void;
}) {
  const winner = review.entries.find((e) => e.isWinner);
  const profit = review.itemValue - review.price;
  const cursed = winner !== undefined && profit < 0;

  return (
    <div className="w-full rounded-xl border border-slate-700 bg-slate-800 p-8 text-center">
      <h2 className="text-lg font-bold text-slate-300">{TEXT.settle.heading}</h2>

      {winner === undefined ? (
        <p className="mt-4 text-xl">{TEXT.settle.passed}</p>
      ) : (
        <div className="mt-4 space-y-2">
          <p className="text-2xl">
            {winner.emoji} <span className="font-bold">{winner.name}</span>
          </p>
          <p className="text-slate-300">
            {TEXT.settle.price} <span className="font-semibold">{formatMoney(review.price)}</span>
            {' · '}
            {TEXT.settle.trueValue}{' '}
            <span className="font-semibold text-amber-300">{formatMoney(review.itemValue)}</span>
          </p>
          <p className={profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {TEXT.settle.profit} {profit >= 0 ? '+' : ''}
            {formatMoney(profit)}
          </p>
          {cursed && <p className="font-semibold text-red-400">{TEXT.settle.winnersCurse}</p>}
        </div>
      )}

      <button
        type="button"
        onClick={onNext}
        className="mt-6 rounded-lg bg-amber-500 px-6 py-2 font-semibold text-slate-900 transition hover:bg-amber-400"
      >
        {TEXT.settle.toReview}
      </button>
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  primary = false,
  disabled = false,
}: {
  children: ReactNode;
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
