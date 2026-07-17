import type { AgentModule } from '../AgentModule';
import { ReceiptsResultView } from './components/ReceiptsResultView';
import { receiptsCleared, receiptsReceived, selectReceiptsResult } from './receiptsSlice';
import type { ReceiptsResultPayload } from './types';

/**
 * The receipts agent module. Read-only: it maps its `result` frame into state and
 * renders a grouped table. No extra tabs or center-pane takeover — the generic
 * shell handles a module that opts out of those.
 */
export const receiptsModule: AgentModule = {
  id: 'receipts-assistant',
  ResultView: ReceiptsResultView,
  hasResult: (s) => selectReceiptsResult(s) !== null,
  reset: (dispatch) => {
    dispatch(receiptsCleared());
  },
  ingest: (dispatch, event) => {
    if (event.type === 'result') {
      dispatch(receiptsReceived(event.payload as ReceiptsResultPayload));
    }
  },
};
