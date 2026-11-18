import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallbackTitle?: string;
    onReset?: () => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    errorMessage: string;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = {
            hasError: false,
            errorMessage: '',
        };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return {
            hasError: true,
            errorMessage: error.message || 'Unexpected rendering error',
        };
    }

    private handleReset = () => {
        this.setState({ hasError: false, errorMessage: '' });
        this.props.onReset?.();
    };

    render(): React.ReactNode {
        if (this.state.hasError) {
            return (
                <div className="h-full w-full flex flex-col items-center justify-center p-6 text-center rounded-lg border border-destructive/30 bg-destructive/5">
                    <div className="p-3 rounded-lg bg-destructive/10 text-destructive mb-3">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h2 className="text-sm font-semibold text-foreground mb-1">
                        {this.props.fallbackTitle || 'Something went wrong'}
                    </h2>
                    <p className="text-xs text-muted-foreground font-mono max-w-md break-words mb-4">
                        {this.state.errorMessage}
                    </p>
                    <button
                        type="button"
                        onClick={this.handleReset}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-card hover:bg-accent text-foreground transition-colors"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset view</span>
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
