import { useGame } from '../state/GameContext';
import { TEXT } from '../text';

// D1 골격: 스테이지 8칸 자리만 잡는다. 제목·언락·별점은 D5~D6에서 stages.ts 기반으로 채운다.
const STAGE_IDS = [1, 2, 3, 4, 5, 6, 7, 8];

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
          {STAGE_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => dispatch({ type: 'SELECT_STAGE', stageId: id })}
              className="rounded-xl border border-slate-700 bg-slate-800 p-4 text-center transition hover:border-amber-400 hover:bg-slate-700"
            >
              <div className="text-2xl">🔨</div>
              <div className="mt-1 text-sm">{TEXT.stageSelect.stageLabel(id)}</div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
