import Editor from '@monaco-editor/react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { EmptyState } from '../../../components/ui/EmptyState';
import { FileIcon } from '../../../components/ui/icons';
import { selectSelectedSkill, skillContentChanged } from '../skillsSlice';

export function SkillEditor() {
  const skill = useAppSelector(selectSelectedSkill);
  const dispatch = useAppDispatch();

  if (!skill) {
    return (
      <EmptyState
        icon={<FileIcon size={28} />}
        title="No skill selected"
        hint="Choose a SKILL.md from the explorer to view and edit it."
      />
    );
  }

  return (
    <div className="min-h-0 flex-1">
      {/* key remounts the editor per skill so undo history doesn't bleed across files */}
      <Editor
        key={skill.id}
        height="100%"
        language="markdown"
        theme="vs-dark"
        value={skill.content}
        onChange={(value) =>
          dispatch(skillContentChanged({ id: skill.id, content: value ?? '' }))
        }
        loading={<div className="p-4 text-xs text-zinc-500">Loading editor…</div>}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineHeight: 20,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          padding: { top: 12, bottom: 12 },
          smoothScrolling: true,
          automaticLayout: true,
          renderLineHighlight: 'line',
        }}
      />
    </div>
  );
}
