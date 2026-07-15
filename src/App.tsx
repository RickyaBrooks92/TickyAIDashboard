import { useEffect } from 'react';
import { useAppDispatch } from './app/hooks';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { TopBar } from './components/layout/TopBar';
import { ConnectGoogleButton, fetchGoogleConnectionStatus } from './features/auth';
import { SettingsMenu, googleConnectionSet } from './features/settings';
import { ControlPlane } from './features/skills';
import { StreamStatus, TelemetryPanel } from './features/telemetry';

/**
 * Two-pane observability dashboard shell:
 *  - Left  (Control Plane):       skills explorer + Monaco markdown editor
 *  - Right (Observability Plane): current context window + execution log
 */
export default function App() {
  const dispatch = useAppDispatch();

  // On load, ask the server whether a Google account is already connected.
  useEffect(() => {
    let cancelled = false;
    void fetchGoogleConnectionStatus().then((connected) => {
      if (!cancelled) dispatch(googleConnectionSet(connected));
    });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return (
    <DashboardLayout
      header={
        <TopBar
          actions={
            <>
              <SettingsMenu />
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
