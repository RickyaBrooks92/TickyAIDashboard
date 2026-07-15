import { useAppSelector } from '../../../app/hooks';
import { PaneHeader } from '../../../components/layout/PaneHeader';
import { EmptyState } from '../../../components/ui/EmptyState';
import { TokenMeter } from '../../../components/ui/TokenMeter';
import { LayersIcon } from '../../../components/ui/icons';
import { formatRelative } from '../../../lib/format';
import { selectContext } from '../telemetrySlice';
import { ContextBlockItem } from './ContextBlockItem';

export function CurrentContextWindow() {
  const context = useAppSelector(selectContext);

  return (
    <section className="flex min-h-0 flex-1 flex-col border-b border-zinc-800">
      <PaneHeader
        title="Current Context"
        subtitle={
          context
            ? `${context.blocks.length} blocks · updated ${formatRelative(context.updatedAt)}`
            : 'no snapshot'
        }
        icon={<LayersIcon size={15} />}
      />
      {context ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="border-b border-zinc-800/60 p-3">
            <TokenMeter used={context.totalTokens} max={context.maxTokens} />
          </div>
          <ul className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2.5">
            {context.blocks.map((block) => (
              <ContextBlockItem
                key={block.id}
                block={block}
                totalTokens={context.totalTokens}
              />
            ))}
          </ul>
        </div>
      ) : (
        <EmptyState
          title="No context captured yet"
          hint="The agent's context window will appear here once a session starts."
        />
      )}
    </section>
  );
}
