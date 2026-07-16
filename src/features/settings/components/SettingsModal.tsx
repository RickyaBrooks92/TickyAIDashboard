import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { cx } from '../../../lib/cx';
import {
  aiProviderKeyCleared,
  aiProviderKeySet,
  modelSelected,
  selectAiProviderKey,
  selectSelectedModel,
} from '../settingsSlice';

export interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** Gemini models the user can run the agent with. */
/** Suggested models (the input is free-text, so any model id also works). */
const MODEL_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'gemini-flash-latest', label: 'confirmed working' },
];

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const dispatch = useAppDispatch();
  const currentKey = useAppSelector(selectAiProviderKey);
  const selectedModel = useAppSelector(selectSelectedModel);
  const [draft, setDraft] = useState('');
  const [reveal, setReveal] = useState(false);

  // Seed the draft from the stored key whenever the modal opens.
  useEffect(() => {
    if (isOpen) {
      setDraft(currentKey ?? '');
      setReveal(false);
    }
  }, [isOpen, currentKey]);

  // Close on Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    const key = draft.trim();
    if (key) dispatch(aiProviderKeySet(key));
    onClose();
  };

  const handleClear = () => {
    dispatch(aiProviderKeyCleared());
    setDraft('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div
        className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
          <h2 className="text-sm font-semibold text-zinc-100">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            aria-label="Close settings"
          >
            ✕
          </button>
        </header>

        <div className="space-y-4 px-4 py-4">
          {/* Model */}
          <div>
            <label htmlFor="ai-model" className="text-xs font-medium text-zinc-300">
              Model
            </label>
            <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
              gemini-flash-latest is the confirmed-working model. You can type a
              different model id if your key (e.g. a paid key) supports one.
            </p>
            <input
              id="ai-model"
              list="ai-model-options"
              value={selectedModel}
              onChange={(e) => dispatch(modelSelected(e.target.value))}
              placeholder="gemini-flash-latest"
              autoComplete="off"
              spellCheck={false}
              className="mt-2 w-full rounded-md border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 font-mono text-xs text-zinc-100 outline-none focus:border-violet-500"
            />
            <datalist id="ai-model-options">
              {MODEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </datalist>
          </div>

          {/* API key */}
          <div>
            <label htmlFor="ai-key" className="text-xs font-medium text-zinc-300">
              Gemini API key
            </label>
            <p className="mt-0.5 text-[11px] leading-relaxed text-zinc-500">
              Bring your own key — get one free at Google AI Studio. Saved in this browser
              (localStorage) so it persists across refreshes, and sent with each agent run.
              Use “Clear key” to remove it.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <input
                id="ai-key"
                type={reveal ? 'text' : 'password'}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Paste your Gemini API key"
                autoComplete="off"
                spellCheck={false}
                className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-950 px-2.5 py-1.5 font-mono text-xs text-zinc-100 outline-none focus:border-violet-500"
              />
              <button
                type="button"
                onClick={() => setReveal((r) => !r)}
                className="shrink-0 rounded-md border border-zinc-700 px-2 py-1.5 text-[11px] text-zinc-300 transition-colors hover:bg-zinc-800"
              >
                {reveal ? 'Hide' : 'Show'}
              </button>
            </div>
            <p
              className={cx(
                'mt-2 text-[11px]',
                currentKey ? 'text-emerald-400' : 'text-zinc-500',
              )}
            >
              {currentKey ? '● Key saved (this browser)' : '○ No key set'}
            </p>
          </div>
        </div>

        <footer className="flex items-center justify-between border-t border-zinc-800 px-4 py-3">
          <button
            type="button"
            onClick={handleClear}
            disabled={!currentKey}
            className="rounded-md border border-zinc-700 px-2.5 py-1 text-xs text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-40"
          >
            Clear key
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-md bg-violet-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-violet-500"
            >
              Save
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
