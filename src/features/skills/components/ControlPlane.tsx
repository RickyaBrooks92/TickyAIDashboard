import { useAppSelector } from '../../../app/hooks';
import { EmailDetailView } from '../../results/components/EmailDetailView';
import { selectSelectedEmail } from '../../telemetry/telemetrySlice';
import { EditorToolbar } from './EditorToolbar';
import { SkillEditor } from './SkillEditor';
import { SkillExplorer } from './SkillExplorer';

/**
 * Left pane: skills explorer sidebar + the center area, which shows the markdown
 * editor by default and swaps to the email reader when a message is opened.
 */
export function ControlPlane() {
  const selectedEmail = useAppSelector(selectSelectedEmail);

  return (
    <div className="flex min-w-0 flex-1">
      <SkillExplorer />
      {selectedEmail ? (
        <EmailDetailView />
      ) : (
        <div className="flex min-w-0 flex-1 flex-col bg-zinc-950">
          <EditorToolbar />
          <SkillEditor />
        </div>
      )}
    </div>
  );
}
