import { DashboardLayout } from './components/layout/DashboardLayout';
import { TopBar } from './components/layout/TopBar';
import { ConnectGoogleButton } from './features/auth';
import { ControlPlane } from './features/skills';
import { StreamStatus, TelemetryPanel } from './features/telemetry';

/**
 * Two-pane observability dashboard shell:
 *  - Left  (Control Plane):       skills explorer + Monaco markdown editor
 *  - Right (Observability Plane): current context window + execution log
 */
export default function App() {
  return (
    <DashboardLayout
      header={
        <TopBar
          actions={
            <>
              <ConnectGoogleButton />
              <StreamStatus />
            </>
          }
        />
      }
      left={<ControlPlane />}
      right={<TelemetryPanel />}
    />
  );
}
