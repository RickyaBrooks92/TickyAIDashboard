/** How safe an email is to delete — drives the color-coded Results grouping. */
export type CleanupPriority = 'high' | 'medium' | 'low';

/** One email the agent proposes to delete/archive; awaits human approval. */
export interface FlaggedEmail {
  id: string;
  sender: string;
  subject: string;
  reason: string;
  priority: CleanupPriority;
}

/** Structured JSON result emitted by the email-assistant agent. */
export interface EmailResultPayload {
  summary: string;
  flaggedForDeletion: FlaggedEmail[];
}

/** A raw email fetched from Gmail (mirror of the server's ParsedEmail). */
export interface ParsedEmail {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
}
