import type { EnglishState } from '../../engine/auction';
import { TEXT, formatMoney } from '../text';

export interface RealtimeParticipant {
  id: string;
  name: string;
  emoji: string;
}

// 영국식(공개 상승) 패널: 호가 상승을 지켜보며 "포기" 타이밍을 정한다
export default function EnglishBidPanel({
  live,
  participants,
  playerId,
  onDrop,
}: {
  live: EnglishState;
  participants: RealtimeParticipant[];
  playerId: string;
  onDrop: () => void;
}) {
  const playerActive = live.activeIds.includes(playerId);

  return (
    <div className="w-full rounded-xl border border-slate-700 bg-slate-800 p-6 text-center">
      <p className="text-sm text-slate-400">{TEXT.bidding.englishHint}</p>

      <p className="mt-4 text-sm text-slate-400">{TEXT.bidding.currentPrice}</p>
      <p className="text-5xl font-bold tabular-nums text-amber-300">
        {formatMoney(live.price)}
      </p>

      <ul className="mt-5 flex justify-center gap-6 text-sm">
        {participants.map((p) => {
          const active = live.activeIds.includes(p.id);
          const drop = live.drops.find((d) => d.id === p.id);
          return (
            <li key={p.id} className={active ? '' : 'opacity-40'}>
              <div className="text-2xl">{p.emoji}</div>
              <div className="font-semibold">{p.name}</div>
              <div className="text-xs text-slate-400">
                {active
                  ? TEXT.bidding.inAuction
                  : drop !== undefined && drop.bid > 0
                    ? TEXT.review.droppedAt(drop.bid)
                    : TEXT.bidding.notEntered}
              </div>
            </li>
          );
        })}
      </ul>

      {playerActive ? (
        <button
          type="button"
          onClick={onDrop}
          className="mt-6 w-full rounded-lg bg-red-500 px-5 py-3 font-semibold text-white transition hover:bg-red-400"
        >
          🏳️ {TEXT.bidding.drop}
        </button>
      ) : (
        <p className="mt-6 text-sm text-slate-500">{TEXT.bidding.watching}</p>
      )}
    </div>
  );
}
