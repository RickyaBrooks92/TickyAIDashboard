import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { selectAiProviderKey, selectSelectedModel } from '../../settings/settingsSlice';
import { selectSelectedSkill } from '../../skills/skillsSlice';
import {
  contextUpdated,
  inboxFetched,
  logAppended,
  rawEmailsCleared,
  resultCleared,
  resultReceived,
  streamingSet,
} from '../telemetrySlice';
import type { AgentRunRequest, AgentStreamEvent } from '../types';

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
 * Drives an agent run by POSTing to the server's SSE endpoint (via
 * fetch-event-source, so we can send the BYOK key as a header) and dispatching
 * each frame into the telemetry slice. Redux surface is unchanged.
 */
export function useAgentRunner(): UseAgentRunner {
  const dispatch = useAppDispatch();
  const skill = useAppSelector(selectSelectedSkill);
  const apiKey = useAppSelector(selectAiProviderKey);
  const model = useAppSelector(selectSelectedModel);
  const [isRunning, setIsRunning] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const completedRef = useRef(false);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    controllerRef.current?.abort();
    controllerRef.current = null;
    dispatch(streamingSet(false));
    setIsRunning(false);
  }, [dispatch]);

  // Abort any in-flight stream on unmount without emitting a stray error.
  useEffect(() => {
    return () => {
      completedRef.current = true;
      controllerRef.current?.abort();
      controllerRef.current = null;
    };
  }, []);

  const run = useCallback(() => {
    if (isRunning || !skill) return;

    dispatch(resultCleared());
    dispatch(rawEmailsCleared());
    dispatch(streamingSet(true));
    setIsRunning(true);
    completedRef.current = false;

    const controller = new AbortController();
    controllerRef.current = controller;

    void fetchEventSource(AGENT_RUN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // BYOK: the user's key (may be empty — the server responds with a
        // helpful error frame in that case).
        'x-ai-provider-key': apiKey ?? '',
      },
      body: JSON.stringify({ skill: skill.name, model } satisfies AgentRunRequest),
      signal: controller.signal,
      openWhenHidden: true,
      onmessage(message) {
        let event: AgentStreamEvent;
        try {
          event = JSON.parse(message.data) as AgentStreamEvent;
        } catch {
          return; // ignore a malformed frame
        }
        switch (event.type) {
          case 'log':
            dispatch(logAppended(event.entry));
            break;
          case 'context':
            dispatch(contextUpdated(event.snapshot));
            break;
          case 'inbox_fetched':
            dispatch(inboxFetched(event.payload));
            break;
          case 'result':
            dispatch(resultReceived(event.result));
            break;
          case 'done':
            finish();
            break;
        }
      },
      onclose() {
        // One-shot stream: a close means we're finished — don't auto-reconnect.
        finish();
        throw new Error('stream complete');
      },
      onerror(err) {
        if (!completedRef.current) {
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
        }
        throw err; // never auto-retry a one-shot run
      },
    }).catch(() => {
      // Terminal errors are surfaced via onerror/onclose; swallow the rejection.
    });
  }, [apiKey, dispatch, finish, isRunning, model, skill]);

  return { isRunning, canRun: Boolean(skill) && !isRunning, run };
}
