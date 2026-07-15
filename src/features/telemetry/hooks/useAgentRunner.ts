import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { selectSelectedSkill } from '../../skills/skillsSlice';
import {
  contextUpdated,
  logAppended,
  resultCleared,
  resultReceived,
  streamingSet,
} from '../telemetrySlice';
import type { AgentStreamEvent } from '../types';

/** Local SSE endpoint exposed by the Node/Express agent runner (server/). */
const AGENT_RUN_URL = 'http://localhost:3001/api/agent/run';

export interface UseAgentRunner {
  /** True while a live run is streaming events. */
  isRunning: boolean;
  /** True when a skill is selected and no run is in flight. */
  canRun: boolean;
  /** Start a run for the currently selected skill (opens the SSE stream). */
  run: () => void;
}

/**
 * Drives an agent run by consuming the server's Server-Sent Events stream and
 * dispatching each frame into the telemetry slice. The transport is HTTP/SSE;
 * the Redux surface is unchanged from the previous mock implementation.
 */
export function useAgentRunner(): UseAgentRunner {
  const dispatch = useAppDispatch();
  const skill = useAppSelector(selectSelectedSkill);
  const [isRunning, setIsRunning] = useState(false);
  const sourceRef = useRef<EventSource | null>(null);
  const completedRef = useRef(false);

  const finish = useCallback(() => {
    completedRef.current = true;
    sourceRef.current?.close();
    sourceRef.current = null;
    dispatch(streamingSet(false));
    setIsRunning(false);
  }, [dispatch]);

  // Close any open stream if the component unmounts mid-run.
  useEffect(() => {
    return () => {
      sourceRef.current?.close();
      sourceRef.current = null;
    };
  }, []);

  const run = useCallback(() => {
    if (isRunning || !skill) return;

    dispatch(resultCleared()); // wipe any previous run's result
    dispatch(streamingSet(true));
    setIsRunning(true);
    completedRef.current = false;

    const url = `${AGENT_RUN_URL}?skill=${encodeURIComponent(skill.name)}`;
    const source = new EventSource(url);
    sourceRef.current = source;

    source.onmessage = (message: MessageEvent) => {
      let event: AgentStreamEvent;
      try {
        event = JSON.parse(message.data as string) as AgentStreamEvent;
      } catch {
        return; // ignore a malformed frame rather than tear down the run
      }

      switch (event.type) {
        case 'log':
          dispatch(logAppended(event.entry));
          break;
        case 'context':
          dispatch(contextUpdated(event.snapshot));
          break;
        case 'result':
          dispatch(resultReceived(event.result));
          break;
        case 'done':
          finish();
          break;
      }
    };

    source.onerror = () => {
      if (completedRef.current) return; // normal completion already closed the stream
      dispatch(
        logAppended({
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          level: 'error',
          type: 'system',
          message: 'Agent stream disconnected — is the server running on :3001?',
        }),
      );
      finish();
    };
  }, [dispatch, finish, isRunning, skill]);

  return { isRunning, canRun: Boolean(skill) && !isRunning, run };
}
