import { CATEGORY_LABEL } from '../../engine/items';
import type { Appraisal, Item } from '../../engine/types';
import { TEXT } from '../text';

// 진짜 가치(item.value)는 절대 표시하지 않는다 — SETTLE에서만 공개.
export default function ItemCard({
  item,
  appraisal,
  refreshed = false,
}: {
  item: Item;
  appraisal: Appraisal;
  refreshed?: boolean;
}) {
  return (
    <div className="w-full rounded-xl border border-slate-700 bg-slate-800 p-8 text-center">
      <div className="text-5xl">{item.emoji}</div>
      <h2 className="mt-3 text-xl font-bold">{item.name}</h2>
      <span className="mt-1 inline-block rounded-full border border-slate-600 px-2 py-0.5 text-xs text-slate-400">
        {CATEGORY_LABEL[item.category]}
      </span>
      <p className="mt-2 text-lg text-amber-300">
        {TEXT.appraisal.label(appraisal.value, appraisal.sigma)}
      </p>
      {refreshed && <p className="mt-1 text-sm text-emerald-400">{TEXT.appraisal.refreshed}</p>}
    </div>
  );
}
