import { useAppSelector } from '../../../app/hooks';
import { selectActiveResult } from '../../telemetry/telemetrySlice';
import { EmailCleanupWidget } from './EmailCleanupWidget';

/** Results-tab body for the email agent: the priority-tiered cleanup verdict. */
export function EmailResultView() {
  const result = useAppSelector(selectActiveResult);
  if (!result) return null; // ResultsHost guards this, but stay defensive.
  return <EmailCleanupWidget result={result} />;
}
