import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../../app/store';
import type { EmailResultPayload, ParsedEmail } from '../../telemetry/types';

/** State owned by the email-assistant agent: fetched inbox, verdict, open reader. */
export interface EmailState {
  activeResult: EmailResultPayload | null;
  rawEmails: ParsedEmail[] | null;
  selectedEmail: ParsedEmail | null;
}

const initialState: EmailState = {
  activeResult: null,
  rawEmails: null,
  selectedEmail: null,
};

const emailSlice = createSlice({
  name: 'email',
  initialState,
  reducers: {
    /** Store the structured cleanup verdict (renders in the Results tab). */
    resultReceived(state, action: PayloadAction<EmailResultPayload>) {
      state.activeResult = action.payload;
    },
    /** Clear the active verdict (e.g. at the start of a new run). */
    resultCleared(state) {
      state.activeResult = null;
    },
    /** Store the raw emails fetched from Gmail for this run. */
    inboxFetched(state, action: PayloadAction<ParsedEmail[]>) {
      state.rawEmails = action.payload;
    },
    /** Clear the raw emails + any open reader (e.g. at the start of a new run). */
    rawEmailsCleared(state) {
      state.rawEmails = null;
      state.selectedEmail = null;
    },
    /** Open an email in the center reader. */
    emailOpened(state, action: PayloadAction<ParsedEmail>) {
      state.selectedEmail = action.payload;
    },
    /** Close the center reader (back to the skill editor). */
    emailClosed(state) {
      state.selectedEmail = null;
    },
  },
});

export const {
  resultReceived,
  resultCleared,
  inboxFetched,
  rawEmailsCleared,
  emailOpened,
  emailClosed,
} = emailSlice.actions;

export const selectActiveResult = (state: RootState): EmailResultPayload | null =>
  state.email.activeResult;

export const selectRawEmails = (state: RootState): ParsedEmail[] | null =>
  state.email.rawEmails;

export const selectSelectedEmail = (state: RootState): ParsedEmail | null =>
  state.email.selectedEmail;

export default emailSlice.reducer;
