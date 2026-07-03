"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  stageName: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class StageErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error(`[ErrorBoundary:${this.props.stageName}]`, error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center gap-4 p-8 rounded-2xl bg-red-500/10 border border-red-500/30 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 text-2xl font-bold">!</div>
          <div>
            <p className="font-semibold text-red-400">Something went wrong in {this.props.stageName}</p>
            <p className="text-sm text-neutral-400 mt-1">{this.state.error?.message || "An unexpected error occurred."}</p>
          </div>
          <button
            onClick={this.handleRetry}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
