import { useState } from 'react';
import { useAppSelector } from '../../../app/hooks';
import { SettingsIcon } from '../../../components/ui/icons';
import { selectHasAiProviderKey } from '../settingsSlice';
import { SettingsModal } from './SettingsModal';

/** TopBar gear button that opens the Settings modal; dot shows a key is set. */
export function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const hasKey = useAppSelector(selectHasAiProviderKey);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
        title="Settings"
        aria-label="Settings"
      >
        <SettingsIcon size={16} />
        {hasKey && (
          <span
            className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400 ring-2 ring-zinc-900"
            aria-hidden="true"
          />
        )}
      </button>
      <SettingsModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
