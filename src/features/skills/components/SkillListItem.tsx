import type { Skill } from '../types';
import { cx } from '../../../lib/cx';
import { FileIcon } from '../../../components/ui/icons';

export interface SkillListItemProps {
  skill: Skill;
  isSelected: boolean;
  onSelect: () => void;
}

export function SkillListItem({ skill, isSelected, onSelect }: SkillListItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-current={isSelected}
        className={cx(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
          isSelected
            ? 'bg-violet-500/15 text-zinc-100 ring-1 ring-inset ring-violet-500/30'
            : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200',
        )}
      >
        <FileIcon
          size={14}
          className={cx('shrink-0', isSelected ? 'text-violet-300' : 'text-zinc-500')}
        />
        <span className="min-w-0 flex-1 truncate">{skill.name}</span>
        {skill.isDirty && (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400"
            title="Unsaved changes"
            aria-label="Unsaved changes"
          />
        )}
      </button>
    </li>
  );
}
