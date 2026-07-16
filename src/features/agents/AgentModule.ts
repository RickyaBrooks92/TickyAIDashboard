import type { ComponentType } from 'react';
import type { AppDispatch, RootState } from '../../app/store';
import type { AgentStreamEvent } from '../telemetry/types';

/**
 * An extra pane tab an agent contributes between Telemetry and Results
 * (e.g. the email agent's "Raw Data" inbox).
 */
export interface AgentTab {
  id: string;
  label: string;
  /** The tab body. */
  View: ComponentType;
  /** Whether the tab has fresh content — drives the ready-dot and auto-switch. */
  hasContent: (state: RootState) => boolean;
}

/**
 * Everything domain-specific about one agent type, kept out of the shell. The
 * generic core (run/log/context/editor) resolves the active module by the
 * selected skill's name and delegates rendering + SSE-frame handling to it.
 *
 * Predicates are plain selectors (not hooks) so the shell can call a single
 * stable `useAppSelector` regardless of which module — or none — is active.
 */
export interface AgentModule {
  /** Matches the SKILL.md `name` (e.g. "email-assistant"). */
  id: string;
  /** Renders the structured result in the Results tab (only when hasResult). */
  ResultView: ComponentType;
  hasResult: (state: RootState) => boolean;
  /** Extra tabs shown between Telemetry and Results. */
  tabs?: AgentTab[];
  /** Optional center-pane takeover (email → the message reader). */
  DetailView?: ComponentType;
  hasDetail?: (state: RootState) => boolean;
  /** Reset this module's state at the start of a run. */
  reset?: (dispatch: AppDispatch) => void;
  /** Map non-generic SSE frames (anything but log/context/done) into module state. */
  ingest: (dispatch: AppDispatch, event: AgentStreamEvent) => void;
}
