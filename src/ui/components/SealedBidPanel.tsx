import { useState } from 'react';
import { TEXT, formatMoney } from '../text';

// 봉투 방식(비공개 1가·2가) 입찰 패널
export default function SealedBidPanel({
  auctionType,
  budget,
  onSubmit,
}: {
  auctionType: 'sealed-first' | 'sealed-second';
  budget: number;
  onSubmit: (amount: number) => void;
}) {
  const [amount, setAmount] = useState('');
  const parsed = Math.max(0, Math.min(Math.floor(Number(amount) || 0), budget));

  return (
    <div className="w-full rounded-xl border border-slate-700 bg-slate-800 p-6">
      <p className="text-sm text-slate-400">
        {auctionType === 'sealed-first'
          ? TEXT.bidding.sealedFirstHint
          : TEXT.bidding.sealedSecondHint}
      </p>
      <div className="mt-4 flex items-center gap-3">
        <label className="text-sm text-slate-300" htmlFor="bid-amount">
          {TEXT.bidding.amountLabel}
        </label>
        <input
          id="bid-amount"
          type="number"
          min={0}
          max={budget}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-40 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-right text-lg tabular-nums"
        />
        <span className="text-xs text-slate-500">
          {TEXT.bidding.zeroNote} · 최대 {formatMoney(budget)}
        </span>
      </div>
      <button
        type="button"
        onClick={() => onSubmit(parsed)}
        className="mt-4 w-full rounded-lg bg-amber-500 px-5 py-3 font-semibold text-slate-900 transition hover:bg-amber-400"
      >
        ✉️ {TEXT.bidding.submit} ({formatMoney(parsed)})
      </button>
    </div>
  );
}
