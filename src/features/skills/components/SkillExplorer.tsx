import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { PaneHeader } from '../../../components/layout/PaneHeader';
import { FolderIcon, PlusIcon } from '../../../components/ui/icons';
import {
  selectAllSkills,
  selectSelectedSkillId,
  skillCreated,
  skillSelected,
} from '../skillsSlice';
import { SkillListItem } from './SkillListItem';

export function SkillExplorer() {
  const skills = useAppSelector(selectAllSkills);
  const selectedId = useAppSelector(selectSelectedSkillId);
  const dispatch = useAppDispatch();

  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-900/20">
      <PaneHeader
        title="Skills"
        subtitle={`${skills.length} SKILL.md`}
        icon={<FolderIcon size={15} />}
        actions={
          <button
            type="button"
            onClick={() => dispatch(skillCreated('untitled'))}
            className="flex h-6 w-6 items-center justify-center rounded text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
            title="New skill"
            aria-label="New skill"
          >
            <PlusIcon size={15} />
          </button>
        }
      />
      <nav className="min-h-0 flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {skills.map((skill) => (
            <SkillListItem
              key={skill.id}
              skill={skill}
              isSelected={skill.id === selectedId}
              onSelect={() => dispatch(skillSelected(skill.id))}
            />
          ))}
        </ul>
      </nav>
    </aside>
  );
}
