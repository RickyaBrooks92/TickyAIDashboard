import { SkillExplorer } from './SkillExplorer';
import { EditorToolbar } from './EditorToolbar';
import { SkillEditor } from './SkillEditor';

/** Left pane: skills explorer sidebar + the markdown editor area. */
export function ControlPlane() {
  return (
    <div className="flex min-w-0 flex-1">
      <SkillExplorer />
      <div className="flex min-w-0 flex-1 flex-col bg-zinc-950">
        <EditorToolbar />
        <SkillEditor />
      </div>
    </div>
  );
}
