import type { ReactNode } from 'react';
import type { ReviewData, ReviewEntry } from '../../engine/review';
import { PLAYER_ID } from '../state/gameReducer';
import { useGame } from '../state/GameContext';
import { TEXT, formatMoney } from '../text';

/** 방식별 입찰 표기: 봉투 = 입찰액, 영국식 = 탈락 시점, 네덜란드식 = 목표가 */
function bidText(review: ReviewData, entry: ReviewEntry): string {
  if (entry.isWinner) return TEXT.review.wonAt(entry.bid);
  switch (review.auctionType) {
    case 'english':
      return entry.bid > 0 ? TEXT.review.droppedAt(entry.bid) : TEXT.review.noBid;
    case 'dutch':
      if (entry.id === PLAYER_ID) return TEXT.review.notClaimed;
      return entry.bid > 0 ? TEXT.review.targetWas(entry.bid) : TEXT.review.noBid;
    default:
      return entry.bid > 0 ? TEXT.review.bidLabel(entry.bid) : TEXT.review.noBid;
  }
}

// 복기 v1: 전원의 감정치 vs 진짜 가치(막대), 입찰액, AI 대사.
// 판별 피드백(feedback)은 D4에서 채워진다.
export default function Review() {
  const { state, dispatch } = useGame();
  const { stage, review, round } = state;
  if (stage === null || review === null || round === null) return null;

  const maxValue = Math.max(review.itemValue, ...review.entries.map((e) => e.appraisal));
  const isLastRound = state.roundIndex + 1 >= stage.rounds;
  const profit = review.itemValue - review.price;

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 p-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold">{TEXT.review.heading}</h1>
        <p className="mt-1 text-sm text-slate-400">
          {round.item.emoji} {round.item.name}
          {review.winnerId !== null && (
            <span className={profit >= 0 ? 'ml-2 text-emerald-400' : 'ml-2 text-red-400'}>
              {TEXT.settle.profit} {profit >= 0 ? '+' : ''}
              {formatMoney(profit)}
            </span>
          )}
        </p>
      </header>

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
            <div
              key={entry.id}
              className={entry.id === PLAYER_ID ? '-mx-2 rounded-lg bg-slate-700/30 px-2 py-1' : ''}
            >
              <ValueBar
                label={`${entry.emoji} ${entry.name}`}
                value={entry.appraisal}
                maxValue={maxValue}
                barClass={entry.appraisal > review.itemValue ? 'bg-red-400' : 'bg-sky-400'}
                suffix={
                  <span className="text-xs text-slate-400">
                    {bidText(review, entry)}
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
