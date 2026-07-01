import { acquiredValue, isStageCleared } from '../../engine/stage';
import { PLAYER_ID } from '../state/gameReducer';
import { useGame } from '../state/GameContext';
import { TEXT, formatMoney } from '../text';

// 별점(★~★★★)과 언락 저장은 D6에서.
export default function Result() {
  const { state, dispatch } = useGame();
  const stage = state.stage;
  if (stage === null) return null;

  const acquired = acquiredValue(state.history, PLAYER_ID);
  const cleared = isStageCleared(stage, state.history, PLAYER_ID);
  const curseCount = state.history.filter(
    (r) => r.winnerId === PLAYER_ID && r.winnersCurse,
  ).length;

  return (
    <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">{TEXT.result.heading}</h1>

      <div className="w-full rounded-xl border border-slate-700 bg-slate-800 p-8 text-center">
        <p className="text-3xl font-bold">
          {cleared ? TEXT.result.cleared : TEXT.result.failed}
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
