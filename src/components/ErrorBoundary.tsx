"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/** best-practices: isolate client crashes (leaderboard, globe) from the full page. */
export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // Hook Sentry / logging here (sentry-cli) instead of console in prod
    console.error("UI boundary caught:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div
            role="alert"
            className="p-8 rounded-3xl border border-rose-900/40 bg-rose-950/20 text-rose-200 text-center space-y-2"
          >
            <h2 className="text-lg font-bold">Something went wrong</h2>
            <p className="text-xs text-neutral-400">
              This section failed to render. Try reloading the page.
            </p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
