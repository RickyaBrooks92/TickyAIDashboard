import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { Badge } from '../../../components/ui/Badge';
import { FileIcon, SaveIcon } from '../../../components/ui/icons';
import { cx } from '../../../lib/cx';
import { selectSelectedSkill, skillSaved } from '../skillsSlice';

export function EditorToolbar() {
  const skill = useAppSelector(selectSelectedSkill);
  const dispatch = useAppDispatch();
  const canSave = Boolean(skill?.isDirty);

  return (
    <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-zinc-800 bg-zinc-900/40 px-3">
      <div className="flex min-w-0 items-center gap-2">
        <FileIcon size={14} className="shrink-0 text-zinc-500" />
        <span className="truncate font-mono text-xs text-zinc-300">
          {skill ? skill.path : 'No file selected'}
        </span>
        {skill?.isDirty && <Badge tone="amber">unsaved</Badge>}
      </div>
      <button
        type="button"
        disabled={!canSave}
        onClick={() => {
          if (skill) dispatch(skillSaved(skill.id));
        }}
        className={cx(
          'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
          canSave
            ? 'bg-violet-600 text-white hover:bg-violet-500'
            : 'cursor-not-allowed bg-zinc-800 text-zinc-500',
        )}
      >
        <SaveIcon size={13} />
        Save
      </button>
    </div>
  );
}
