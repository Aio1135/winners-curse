import { createBidder } from '../../bidders';
import { acquiredValue, isStageCleared, stageStars } from '../../engine/stage';
import { PLAYER_ID } from '../state/gameReducer';
import { useGame } from '../state/GameContext';
import { TEXT, formatMoney } from '../text';

export default function Result() {
  const { state, dispatch } = useGame();
  const stage = state.stage;
  if (stage === null) return null;

  const acquired = acquiredValue(state.history, PLAYER_ID);
  const cleared = isStageCleared(stage, state.history, PLAYER_ID);
  const stars = stageStars(stage, state.history, PLAYER_ID, state.budget);
  const curseCount = state.history.filter(
    (r) => r.winnerId === PLAYER_ID && r.winnersCurse,
  ).length;

  const names = new Map<string, string>([[PLAYER_ID, TEXT.playerName]]);
  for (const spec of stage.bidders) {
    const bidder = createBidder(spec);
    names.set(bidder.id, `${bidder.emoji} ${bidder.name}`);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">{TEXT.result.heading}</h1>

      <div className="w-full rounded-xl border border-slate-700 bg-slate-800 p-8 text-center">
        <p className="text-3xl font-bold">
          {cleared ? TEXT.result.cleared : TEXT.result.failed}
        </p>
        <p className="mt-2 text-3xl tracking-widest text-amber-300">
          {'★'.repeat(stars)}
          <span className="text-slate-600">{'☆'.repeat(3 - stars)}</span>
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <dt className="text-left text-slate-400">{TEXT.result.acquired}</dt>
          <dd className="text-right font-semibold text-amber-300">{formatMoney(acquired)}</dd>
          <dt className="text-left text-slate-400">{TEXT.result.target}</dt>
          <dd className="text-right font-semibold">{formatMoney(stage.targetValue)}</dd>
          <dt className="text-left text-slate-400">{TEXT.result.budgetLeft}</dt>
          <dd className="text-right font-semibold">{formatMoney(state.budget)}</dd>
        </dl>
        <p className="mt-3 text-sm text-slate-400">{TEXT.result.curseCount(curseCount)}</p>
      </div>

      <section className="w-full rounded-xl border border-slate-700 bg-slate-800 p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-400">
          {TEXT.result.roundsHeading}
        </h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500">
              <th className="py-1 font-normal">{TEXT.result.colItem}</th>
              <th className="py-1 font-normal">{TEXT.result.colWinner}</th>
              <th className="py-1 text-right font-normal">{TEXT.result.colPrice}</th>
              <th className="py-1 text-right font-normal">{TEXT.result.colValue}</th>
            </tr>
          </thead>
          <tbody>
            {state.history.map((r) => (
              <tr
                key={r.roundIndex}
                className={
                  r.winnerId === PLAYER_ID
                    ? 'border-t border-slate-700 bg-slate-700/30'
                    : 'border-t border-slate-700'
                }
              >
                <td className="py-1.5">
                  {r.itemEmoji} {r.itemName}
                </td>
                <td className="py-1.5">
                  {r.winnerId === null ? TEXT.result.passedRow : names.get(r.winnerId)}
                  {r.winnersCurse && ' ⚡'}
                </td>
                <td className="py-1.5 text-right tabular-nums">
                  {r.winnerId === null ? '—' : formatMoney(r.price)}
                </td>
                <td className="py-1.5 text-right tabular-nums text-amber-300">
                  {formatMoney(r.itemValue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <button
        type="button"
        onClick={() => dispatch({ type: 'EXIT_STAGE' })}
        className="rounded-lg bg-amber-500 px-6 py-2 font-semibold text-slate-900 transition hover:bg-amber-400"
      >
        {TEXT.result.backToSelect}
      </button>
    </div>
  );
}
