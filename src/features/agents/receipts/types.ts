export type ReceiptType = 'subscription' | 'receipt';

/** One extracted receipt or subscription (mirror of the server's ReceiptItem). */
export interface ReceiptItem {
  /** Source email id. */
  id: string;
  vendor: string;
  amount: number;
  currency: string;
  date: string;
  type: ReceiptType;
  /** monthly | yearly | weekly | unknown for subscriptions; "" for receipts. */
  cadence: string;
}

/** Structured JSON result emitted by the receipts agent. */
export interface ReceiptsResultPayload {
  summary: string;
  items: ReceiptItem[];
}
