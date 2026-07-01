import type { ReactNode } from 'react';
import { useGame } from '../state/GameContext';
import { TEXT, formatMoney } from '../text';

// 복기 v1: 전원의 감정치 vs 진짜 가치(막대), 입찰액, AI 대사.
// 판별 피드백(feedback)은 D4에서 채워진다.
export default function Review() {
  const { state, dispatch } = useGame();
  const { stage, review } = state;
  if (stage === null || review === null) return null;

  const maxValue = Math.max(review.itemValue, ...review.entries.map((e) => e.appraisal));
  const isLastRound = state.roundIndex + 1 >= stage.rounds;

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 p-6">
      <h1 className="text-center text-2xl font-bold">{TEXT.review.heading}</h1>

      <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">
        {/* 진짜 가치 기준 막대 */}
        <ValueBar
          label={`⭐ ${TEXT.review.trueValueBar}`}
          value={review.itemValue}
          maxValue={maxValue}
          barClass="bg-amber-400"
        />

        <div className="mt-5 space-y-4">
          {review.entries.map((entry) => (
            <div key={entry.id}>
              <ValueBar
                label={`${entry.emoji} ${entry.name}`}
                value={entry.appraisal}
                maxValue={maxValue}
                barClass={entry.appraisal > review.itemValue ? 'bg-red-400' : 'bg-sky-400'}
                suffix={
                  <span className="text-xs text-slate-400">
                    {entry.bid > 0 ? TEXT.review.bidLabel(entry.bid) : TEXT.review.noBid}
                    {entry.isWinner && (
                      <span className="ml-2 rounded bg-amber-500 px-1.5 py-0.5 font-semibold text-slate-900">
                        {TEXT.review.winnerBadge}
                      </span>
                    )}
                  </span>
                }
              />
              {entry.line !== null && (
                <p className="mt-1 pl-1 text-sm text-slate-400">💬 “{entry.line}”</p>
              )}
            </div>
          ))}
        </div>

        {review.feedback.length > 0 && (
          <ul className="mt-5 space-y-1 border-t border-slate-700 pt-4 text-sm text-emerald-300">
            {review.feedback.map((line) => (
              <li key={line}>💡 {line}</li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={() => dispatch({ type: 'NEXT_ROUND' })}
        className="mx-auto rounded-lg bg-amber-500 px-6 py-2 font-semibold text-slate-900 transition hover:bg-amber-400"
      >
        {isLastRound ? TEXT.review.toResult : TEXT.review.next}
      </button>
    </div>
  );
}

function ValueBar({
  label,
  value,
  maxValue,
  barClass,
  suffix,
}: {
  label: string;
  value: number;
  maxValue: number;
  barClass: string;
  suffix?: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="tabular-nums">
          {formatMoney(value)} {suffix}
        </span>
      </div>
      <div className="mt-1 h-2 rounded bg-slate-700">
        <div
          className={`h-2 rounded ${barClass}`}
          style={{ width: `${Math.max(2, (value / maxValue) * 100)}%` }}
        />
      </div>
    </div>
  );
}
