import { useCallback, useEffect, useRef, useState } from 'react';
import { nanoid } from '@reduxjs/toolkit';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { estimateTokens } from '../../../lib/tokens';
import { selectSelectedSkill } from '../../skills/skillsSlice';
import type { Skill } from '../../skills/types';
import { mockEmailResult } from '../mockData';
import {
  contextUpdated,
  logAppended,
  resultCleared,
  resultReceived,
  streamingSet,
} from '../telemetrySlice';
import type {
  ContextBlock,
  ContextWindowSnapshot,
  ExecutionEventType,
  LogLevel,
} from '../types';

const STEP_INTERVAL_MS = 600;
const MAX_CONTEXT_TOKENS = 200_000;

/** One simulated agent-loop step: a log line plus the full context after it runs. */
interface AgentStep {
  level: LogLevel;
  type: ExecutionEventType;
  message: string;
  /** Cumulative context blocks present AFTER this step executes. */
  blocks: ContextBlock[];
}

export interface UseAgentRunner {
  /** True while a simulated run is streaming events. */
  isRunning: boolean;
  /** True when a skill is selected and no run is in flight. */
  canRun: boolean;
  /** Start a simulated run for the currently selected skill. */
  run: () => void;
}

/** Build the deterministic 6-step script for a run of `skill`. */
function buildSteps(skill: Skill): AgentStep[] {
  const systemBlock: ContextBlock = {
    id: 'run-system',
    label: 'System Prompt',
    tokenCount: 1_200,
    content:
      'You are the Tickys email assistant operating over the user inbox. Follow the active skill.',
  };
  const skillBlock: ContextBlock = {
    id: 'run-skill',
    label: `Skill: ${skill.name}`,
    tokenCount: estimateTokens(skill.content),
    content: skill.content.slice(0, 200),
  };
  const mailboxBlock: ContextBlock = {
    id: 'run-mailbox',
    label: 'Mailbox Session',
    tokenCount: 350,
    content: 'Connected to mailbox interface · 12 unread messages available.',
  };
  const payloadBlock: ContextBlock = {
    id: 'run-payload',
    label: 'Inbox Payload (12 headers)',
    tokenCount: 8_400,
    content: 'Parsed Sender / Subject / Date headers for 12 unread messages.',
  };
  const categorizationBlock: ContextBlock = {
    id: 'run-categorization',
    label: 'Categorization Working Set',
    tokenCount: 3_200,
    content: 'Classifying into Action Required / Information / Low-Priority · Promotional.',
  };
  const cleanupBlock: ContextBlock = {
    id: 'run-cleanup',
    label: 'Cleanup Candidates (7)',
    tokenCount: 1_500,
    content: '7 promotional / duplicate messages flagged for trash with rationales.',
  };
  const summaryBlock: ContextBlock = {
    id: 'run-summary',
    label: 'Summary Report',
    tokenCount: 2_100,
    content: '3 urgent action items · executive summary generated.',
  };

  return [
    {
      level: 'info',
      type: 'system',
      message: `Initializing agent context with skill: ${skill.name}`,
      blocks: [systemBlock, skillBlock],
    },
    {
      level: 'info',
      type: 'tool_call',
      message: 'Connecting to mailbox interface...',
      blocks: [systemBlock, skillBlock, mailboxBlock],
    },
    {
      level: 'info',
      type: 'tool_result',
      message: 'Parsing 12 unread email headers...',
      blocks: [systemBlock, skillBlock, mailboxBlock, payloadBlock],
    },
    {
      level: 'info',
      type: 'model_response',
      message: 'Applying categorization logic...',
      blocks: [systemBlock, skillBlock, mailboxBlock, payloadBlock, categorizationBlock],
    },
    {
      level: 'action',
      type: 'tool_result',
      message: 'Identified 7 promotional emails flagged for trash',
      blocks: [
        systemBlock,
        skillBlock,
        mailboxBlock,
        payloadBlock,
        categorizationBlock,
        cleanupBlock,
      ],
    },
    {
      level: 'success',
      type: 'model_response',
      message: 'Summary report generated (3 urgent action items)',
      blocks: [
        systemBlock,
        skillBlock,
        mailboxBlock,
        payloadBlock,
        categorizationBlock,
        cleanupBlock,
        summaryBlock,
      ],
    },
  ];
}

function toSnapshot(blocks: ContextBlock[]): ContextWindowSnapshot {
  const totalTokens = blocks.reduce((sum, block) => sum + block.tokenCount, 0);
  return {
    blocks,
    totalTokens,
    maxTokens: MAX_CONTEXT_TOKENS,
    updatedAt: Date.now(),
  };
}

/**
 * Simulates an agent execution loop for the selected skill, streaming logs and
 * progressive context-window updates into the telemetry slice every ~600ms, then
 * emitting a structured result for the Results tab on completion.
 */
export function useAgentRunner(): UseAgentRunner {
  const dispatch = useAppDispatch();
  const skill = useAppSelector(selectSelectedSkill);
  const [isRunning, setIsRunning] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  // Cancel any pending steps if the component unmounts mid-run.
  useEffect(() => clearTimers, [clearTimers]);

  const run = useCallback(() => {
    if (isRunning || !skill) return;

    clearTimers();
    setIsRunning(true);
    dispatch(streamingSet(true));
    dispatch(resultCleared()); // wipe any previous run's result

    const steps = buildSteps(skill);
    steps.forEach((step, index) => {
      const timer = setTimeout(() => {
        dispatch(
          logAppended({
            id: nanoid(),
            timestamp: Date.now(),
            level: step.level,
            type: step.type,
            message: step.message,
          }),
        );
        dispatch(contextUpdated(toSnapshot(step.blocks)));

        if (index === steps.length - 1) {
          dispatch(streamingSet(false));
          dispatch(resultReceived(mockEmailResult));
          setIsRunning(false);
        }
      }, index * STEP_INTERVAL_MS);
      timers.current.push(timer);
    });
  }, [clearTimers, dispatch, isRunning, skill]);

  return { isRunning, canRun: Boolean(skill) && !isRunning, run };
}
