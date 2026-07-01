import { getStage, TOTAL_STAGE_SLOTS } from '../../stages/stages';
import { useGame } from '../state/GameContext';
import { TEXT } from '../text';

// 언락/별점 표시는 D6에서. 지금은 데이터가 있는 스테이지만 열린다.
export default function StageSelect() {
  const { dispatch } = useGame();

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 p-6">
      <header className="text-center">
        <h1 className="text-4xl font-bold">{TEXT.app.title}</h1>
        <p className="mt-2 text-slate-400">{TEXT.app.subtitle}</p>
      </header>

      <section className="w-full">
        <h2 className="mb-4 text-lg font-semibold text-slate-300">
          {TEXT.stageSelect.heading}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: TOTAL_STAGE_SLOTS }, (_, i) => i + 1).map((id) => {
            const stage = getStage(id);
            return (
              <button
                key={id}
                type="button"
                disabled={stage === undefined}
                onClick={() => dispatch({ type: 'SELECT_STAGE', stageId: id })}
                className="rounded-xl border border-slate-700 bg-slate-800 p-4 text-center transition enabled:hover:border-amber-400 enabled:hover:bg-slate-700 disabled:opacity-40"
              >
                <div className="text-2xl">{stage ? '🔨' : '🔒'}</div>
                <div className="mt-1 text-sm font-semibold">
                  {TEXT.stageSelect.stageLabel(id)}
                </div>
                <div className="mt-0.5 text-xs text-slate-400">
                  {stage ? stage.title : TEXT.stageSelect.comingSoon}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
