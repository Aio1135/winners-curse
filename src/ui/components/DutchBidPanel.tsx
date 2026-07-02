import type { DutchState } from '../../engine/auction';
import { TEXT, formatMoney } from '../text';

// 네덜란드식(공개 하강) 패널: 내려가는 가격을 보며 "낙찰" 타이밍을 정한다
export default function DutchBidPanel({
  live,
  budget,
  onClaim,
}: {
  live: DutchState;
  budget: number;
  onClaim: () => void;
}) {
  const affordable = budget >= live.price;
  const progress = Math.max(
    0,
    Math.min(100, ((live.price - live.floor) / (live.startPrice - live.floor)) * 100),
  );

  return (
    <div className="w-full rounded-xl border border-slate-700 bg-slate-800 p-6 text-center">
      <p className="text-sm text-slate-400">{TEXT.bidding.dutchHint}</p>

      <p className="mt-4 text-sm text-slate-400">{TEXT.bidding.dutchPrice}</p>
      <p className="text-5xl font-bold tabular-nums text-amber-300">
        {formatMoney(live.price)}
      </p>

      <div className="mt-4 h-2 rounded bg-slate-700">
        <div className="h-2 rounded bg-amber-400" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-1 text-xs text-slate-500">{TEXT.bidding.floorNote(live.floor)}</p>

      <button
        type="button"
        onClick={onClaim}
        disabled={!affordable}
        className="mt-6 w-full rounded-lg bg-amber-500 px-5 py-3 text-lg font-bold text-slate-900 transition hover:bg-amber-400 disabled:opacity-40"
      >
        🔨 {TEXT.bidding.claim}
      </button>
      {!affordable && (
        <p className="mt-2 text-xs text-red-400">{TEXT.bidding.overBudget}</p>
      )}
    </div>
  );
}
