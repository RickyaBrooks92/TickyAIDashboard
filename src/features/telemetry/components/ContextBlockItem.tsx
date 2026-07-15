import { formatTokens } from '../../../lib/format';
import type { ContextBlock } from '../types';

export interface ContextBlockItemProps {
  block: ContextBlock;
  totalTokens: number;
}

export function ContextBlockItem({ block, totalTokens }: ContextBlockItemProps) {
  const share =
    totalTokens > 0 ? Math.round((block.tokenCount / totalTokens) * 100) : 0;

  return (
    <li className="rounded-md border border-zinc-800 bg-zinc-900/40 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-xs font-medium text-zinc-200">{block.label}</span>
        <span className="shrink-0 font-mono text-[10px] text-zinc-500">
          {formatTokens(block.tokenCount)} tok · {share}%
        </span>
      </div>
      <p className="mt-1 line-clamp-2 font-mono text-[11px] leading-relaxed text-zinc-500">
        {block.content}
      </p>
    </li>
  );
}
