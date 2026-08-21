import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AppErrorBoundaryState {
  hasError: boolean;
}

interface AppErrorBoundaryProps {
  children: ReactNode;
}

export default class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  declare readonly props: AppErrorBoundaryProps;
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Application render error', error, info);
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="min-h-screen bg-[#0F172A] px-4 text-white flex items-center justify-center">
        <div className="w-full max-w-lg rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-center shadow-2xl">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-300" aria-hidden="true" />
          <h1 className="mb-3 text-2xl font-bold">Something went wrong</h1>
          <p className="mb-6 text-sm leading-relaxed text-slate-300">
            The page could not be displayed. Reload to get the latest version of Mathenzi Edu.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-6 py-3 font-bold text-white transition-colors hover:bg-blue-500"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reload page
          </button>
        </div>
      </main>
    );
  }
}
