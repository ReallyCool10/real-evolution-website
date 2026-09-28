import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          width: '380px',
          maxWidth: 'calc(100vw - 40px)',
          padding: '16px 20px',
          background: 'rgba(239, 68, 68, 0.12)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          borderRadius: '12px',
          color: '#ffffff',
          zIndex: 120,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: 600, fontSize: '0.9rem' }}>
            <span>⚠️</span>
            <span>{this.props.fallbackTitle || 'Display Error'}</span>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.75)', margin: '8px 0 12px 0', lineHeight: 1.4 }}>
            An unexpected error occurred while rendering this panel ({this.state.error?.message}).
          </p>
          <button
            onClick={this.handleReset}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '0.75rem',
              fontWeight: 500,
              padding: '6px 12px',
              cursor: 'pointer'
            }}
          >
            Dismiss & Reset
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
