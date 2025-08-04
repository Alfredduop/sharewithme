import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';
import { ShareWithMeLogo } from './ShareWithMeLogo';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class SafeComponentLoader extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`🚨 SafeComponentLoader caught error in ${this.props.componentName || 'component'}:`, error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to analytics or error reporting service
    try {
      // Send error to analytics
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'exception', {
          description: error.message,
          fatal: false,
          component: this.props.componentName || 'unknown'
        });
      }
    } catch (analyticsError) {
      console.warn('Failed to log error to analytics:', analyticsError);
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-stone-50 via-purple-950/20 to-stone-100 flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md mx-auto">
            <ShareWithMeLogo size="md" />
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-4" />
              <h1 className="text-xl font-bold text-red-600 mb-2">
                {this.props.componentName ? `${this.props.componentName} Error` : 'Component Error'}
              </h1>
              <p className="text-stone-600 text-sm mb-4">
                Something went wrong loading this component. Please try again.
              </p>
              
              {/* Error details for development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-xs text-left bg-red-100 p-3 rounded border mb-4">
                  <summary className="cursor-pointer font-semibold text-red-700 mb-2">
                    Error Details (Development Only)
                  </summary>
                  <div className="space-y-2">
                    <div>
                      <strong>Error:</strong>
                      <pre className="mt-1 text-red-600 whitespace-pre-wrap bg-white p-2 rounded border">
                        {this.state.error.message}
                      </pre>
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className="mt-1 text-red-600 whitespace-pre-wrap bg-white p-2 rounded border text-xs overflow-auto max-h-32">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 text-red-600 whitespace-pre-wrap bg-white p-2 rounded border text-xs overflow-auto max-h-32">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleRetry}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                {this.props.onReset && (
                  <Button 
                    onClick={this.props.onReset}
                    className="flex-1"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go Home
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SafeComponentLoader;