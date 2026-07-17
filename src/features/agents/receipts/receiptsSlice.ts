import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../../app/store';
import type { ReceiptsResultPayload } from './types';

/** State owned by the receipts agent. */
export interface ReceiptsState {
  result: ReceiptsResultPayload | null;
}

const initialState: ReceiptsState = { result: null };

const receiptsSlice = createSlice({
  name: 'receipts',
  initialState,
  reducers: {
    /** Store the extracted receipts + subscriptions (renders in the Results tab). */
    receiptsReceived(state, action: PayloadAction<ReceiptsResultPayload>) {
      state.result = action.payload;
    },
    /** Clear the result (e.g. at the start of a new run). */
    receiptsCleared(state) {
      state.result = null;
    },
  },
});

export const { receiptsReceived, receiptsCleared } = receiptsSlice.actions;

export const selectReceiptsResult = (state: RootState): ReceiptsResultPayload | null =>
  state.receipts.result;

export default receiptsSlice.reducer;
