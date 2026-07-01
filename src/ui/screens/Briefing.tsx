import { createBidder } from '../../bidders';
import { CATEGORY_LABEL } from '../../engine/items';
import { seedFromString } from '../../engine/rng';
import { useGame } from '../state/GameContext';
import { AUCTION_TYPE_LABEL, TEXT, formatMoney } from '../text';

export default function Briefing() {
  const { state, dispatch } = useGame();
  const stage = state.stage;
  if (stage === null) return null;

  const handleStart = () => {
    // 스테이지 + 시작 시각으로 시드를 만들어 매 판이 달라지게 한다 (같은 시드 = 재현 가능)
    const seed = seedFromString(`stage-${stage.id}-${Date.now()}`);
    dispatch({ type: 'START_STAGE', seed });
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold">
        {TEXT.briefing.heading} — {stage.title}
      </h1>

      <dl className="grid w-full grid-cols-2 gap-x-6 gap-y-3 rounded-xl border border-slate-700 bg-slate-800 p-6 text-sm">
        <dt className="text-slate-400">{TEXT.briefing.auctionType}</dt>
        <dd className="text-right font-semibold">{AUCTION_TYPE_LABEL[stage.auctionType]}</dd>
        <dt className="text-slate-400">{TEXT.briefing.rounds}</dt>
        <dd className="text-right font-semibold">{TEXT.briefing.roundsValue(stage.rounds)}</dd>
        <dt className="text-slate-400">{TEXT.briefing.budget}</dt>
        <dd className="text-right font-semibold">{formatMoney(stage.budget)}</dd>
        <dt className="text-slate-400">{TEXT.briefing.coins}</dt>
        <dd className="text-right font-semibold">{TEXT.briefing.coinsValue(stage.coins)}</dd>
        <dt className="text-slate-400">{TEXT.briefing.target}</dt>
        <dd className="text-right font-semibold text-amber-300">
          {TEXT.briefing.targetValue(stage.targetValue)}
        </dd>
      </dl>

      <section className="w-full rounded-xl border border-slate-700 bg-slate-800 p-6">
        <h2 className="text-sm font-semibold text-slate-400">{TEXT.briefing.opponents}</h2>
        <ul className="mt-3 space-y-3">
          {stage.bidders.map((spec) => {
            const bidder = createBidder(spec);
            return (
              <li key={spec.id} className="flex items-center gap-3">
                <span className="text-2xl">{bidder.emoji}</span>
                <div>
                  <div className="font-semibold">
                    {bidder.name}
                    {spec.preferredCategory !== undefined && (
                      <span className="ml-2 text-xs font-normal text-rose-300">
                        ❤️ {TEXT.briefing.preferenceHint(CATEGORY_LABEL[spec.preferredCategory])}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-slate-400">“{bidder.tagline}”</div>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

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
