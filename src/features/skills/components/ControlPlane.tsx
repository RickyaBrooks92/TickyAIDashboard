import { useAppSelector } from '../../../app/hooks';
import { useActiveModule } from '../../agents/useActiveModule';
import { EditorToolbar } from './EditorToolbar';
import { SkillEditor } from './SkillEditor';
import { SkillExplorer } from './SkillExplorer';

/**
 * Left pane: skills explorer + the center area. The center shows the SKILL.md
 * editor by default and hands off to the active agent module's DetailView when it
 * asks to take over (email → the message reader). The shell stays agent-agnostic.
 */
export function ControlPlane() {
  const module = useActiveModule();
  const showDetail = useAppSelector((s) => module?.hasDetail?.(s) ?? false);
  const DetailView = module?.DetailView;

  return (
    <div className="flex min-w-0 flex-1">
      <SkillExplorer />
      {showDetail && DetailView ? (
        <DetailView />
      ) : (
        <div className="flex min-w-0 flex-1 flex-col bg-zinc-950">
          <EditorToolbar />
          <SkillEditor />
        </div>
      )}
    </div>
  );
}
