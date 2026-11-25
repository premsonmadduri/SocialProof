import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    message: '',
  };

  public static getDerivedStateFromError(error: Error): State {
    let readable = 'Something went wrong while connecting to the live supporters counter.';
    try {
      const parsed = JSON.parse(error.message) as { error?: string };
      if (parsed?.error) {
        readable = parsed.error;
      }
    } catch {
      if (error.message) {
        readable = error.message;
      }
    }
    return {
      hasError: true,
      message: readable,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application ErrorBoundary caught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh flex items-center justify-center bg-slate-50 px-6 py-12">
          <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center border border-slate-200 shadow-sm">
            <h1 className="font-display text-xl font-bold text-slate-900">
              Unable to load live counter
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
              {this.state.message}
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className="mt-6 inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
