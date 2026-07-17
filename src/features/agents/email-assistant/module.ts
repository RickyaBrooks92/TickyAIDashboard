import type { AgentModule } from '../AgentModule';
import {
  inboxFetched,
  rawEmailsCleared,
  resultCleared,
  resultReceived,
  selectActiveResult,
  selectRawEmails,
  selectSelectedEmail,
} from './emailSlice';
import { EmailDetailView } from './components/EmailDetailView';
import { EmailResultView } from './components/EmailResultView';
import { InboxPreviewWidget } from './components/InboxPreviewWidget';
import type { EmailResultPayload, ParsedEmail } from './types';

/**
 * The email-assistant agent module. Everything email-specific — the inbox tab,
 * the reader, the cleanup renderer, and how its SSE frames map into state — lives
 * here (or in its components), so the shell stays generic.
 */
export const emailAssistantModule: AgentModule = {
  id: 'email-assistant',
  ResultView: EmailResultView,
  hasResult: (s) => selectActiveResult(s) !== null,
  tabs: [
    {
      id: 'raw',
      label: 'Raw Data',
      View: InboxPreviewWidget,
      hasContent: (s) => (selectRawEmails(s)?.length ?? 0) > 0,
    },
  ],
  DetailView: EmailDetailView,
  hasDetail: (s) => selectSelectedEmail(s) !== null,
  reset: (dispatch) => {
    dispatch(resultCleared());
    dispatch(rawEmailsCleared());
  },
  ingest: (dispatch, event) => {
    if (event.type === 'data' && event.key === 'inbox') {
      dispatch(inboxFetched(event.payload as ParsedEmail[]));
    } else if (event.type === 'result') {
      dispatch(resultReceived(event.payload as EmailResultPayload));
    }
  },
};
