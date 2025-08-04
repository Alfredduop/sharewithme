import { Component, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./ui/button";
import { ShareWithMeLogo } from "./ShareWithMeLogo";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class AppErrorBoundary extends Component<{children: ReactNode}, ErrorBoundaryState> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🚨 App-level error caught:', error, errorInfo);
    
    // Log to analytics if available
    try {
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: error.message,
          fatal: true,
          error_boundary: 'app_level'
        });
      }
    } catch (analyticsError) {
      console.warn('Failed to log error to analytics:', analyticsError);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-purple-950/20 to-stone-100 flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md mx-auto">
            <ShareWithMeLogo size="lg" />
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-red-600 mb-2">Application Error</h1>
              <p className="text-stone-600 mb-4">
                We encountered an unexpected error. Please refresh the page to try again.
              </p>
              <Button 
                onClick={() => window.location.reload()}
                className="min-h-[48px] px-6 text-base w-full"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}