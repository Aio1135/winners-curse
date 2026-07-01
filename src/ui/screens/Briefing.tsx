import { seedFromString } from '../../engine/rng';
import { useGame } from '../state/GameContext';
import { TEXT } from '../text';

// D1 골격: 경매 방식·예산·클리어 조건·AI 소개는 D5에서 stages.ts 기반으로 채운다.
export default function Briefing() {
  const { state, dispatch } = useGame();

  const handleStart = () => {
    // 스테이지 + 시작 시각으로 시드를 만들어 매 판이 달라지게 한다 (같은 시드 = 재현 가능)
    const seed = seedFromString(`stage-${state.stageId}-${Date.now()}`);
    dispatch({ type: 'START_STAGE', seed });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">
        {TEXT.briefing.heading} — {TEXT.stageSelect.stageLabel(state.stageId ?? 0)}
      </h1>

      <div className="w-full rounded-xl border border-slate-700 bg-slate-800 p-6 text-center text-slate-400">
        {TEXT.briefing.placeholder}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => dispatch({ type: 'EXIT_STAGE' })}
          className="rounded-lg border border-slate-600 px-5 py-2 text-slate-300 transition hover:bg-slate-800"
        >
          {TEXT.briefing.back}
        </button>
        <button
          type="button"
          onClick={handleStart}
          className="rounded-lg bg-amber-500 px-5 py-2 font-semibold text-slate-900 transition hover:bg-amber-400"
        >
          {TEXT.briefing.start}
        </button>
      </div>
    </div>
  );
}
