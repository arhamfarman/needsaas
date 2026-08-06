/**
 * Wraps children in a dark-mode container for app pages (dashboard, search, etc.)
 * while the marketing landing page stays light.
 */
export function DarkModeShell({ children }: { children: React.ReactNode }) {
  return <div className="dark">{children}</div>;
}
