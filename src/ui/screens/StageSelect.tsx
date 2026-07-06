import { useRef, useState } from 'react';
import { isStageUnlocked, parseProgress, serializeProgress } from '../../engine/stage';
import { getStage, TOTAL_STAGE_SLOTS } from '../../stages/stages';
import { useGame } from '../state/GameContext';
import { TEXT } from '../text';

export default function StageSelect() {
  const { state, dispatch } = useGame();
  const fileInput = useRef<HTMLInputElement>(null);
  const [importMessage, setImportMessage] = useState<'ok' | 'error' | null>(null);

  const handleExport = () => {
    const blob = new Blob([serializeProgress(state.progress)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'winners-curse-progress.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    const progress = parseProgress(await file.text());
    if (progress === null) {
      setImportMessage('error');
      return;
    }
    dispatch({ type: 'IMPORT_PROGRESS', progress });
    setImportMessage('ok');
  };

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
            const unlocked = stage !== undefined && isStageUnlocked(id, state.progress);
            const stars = state.progress[id] ?? 0;
            return (
              <button
                key={id}
                type="button"
                disabled={!unlocked}
                onClick={() => dispatch({ type: 'SELECT_STAGE', stageId: id })}
                className="rounded-xl border border-slate-700 bg-slate-800 p-4 text-center transition enabled:hover:border-amber-400 enabled:hover:bg-slate-700 disabled:opacity-40"
              >
                <div className="text-2xl">{unlocked ? '🔨' : '🔒'}</div>
                <div className="mt-1 text-sm font-semibold">
                  {TEXT.stageSelect.stageLabel(id)}
                </div>
                <div className="mt-0.5 text-xs text-slate-400">
                  {stage === undefined
                    ? TEXT.stageSelect.comingSoon
                    : unlocked
                      ? stage.title
                      : TEXT.stageSelect.lockedHint}
                </div>
                <div className="mt-1 text-sm tracking-widest text-amber-300">
                  {unlocked ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : ' '}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <footer className="flex flex-col items-center gap-2">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            💾 {TEXT.stageSelect.exportProgress}
          </button>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            📂 {TEXT.stageSelect.importProgress}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file !== undefined) void handleImportFile(file);
              e.target.value = '';
            }}
          />
        </div>
        {importMessage === 'error' && (
          <p className="text-sm text-red-400">{TEXT.stageSelect.importError}</p>
        )}
        {importMessage === 'ok' && (
          <p className="text-sm text-emerald-400">{TEXT.stageSelect.importDone}</p>
        )}
      </footer>
    </div>
  );
}
