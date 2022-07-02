import { Component, ReactNode, ErrorInfo } from 'react';

export class ErrorBoundary extends Component<
	{ fallback?: ReactNode; onError?: (error: Error, errorInfo: ErrorInfo) => void },
	{ hasError: boolean }
> {
	state = { hasError: false };

	static getDerivedStateFromError(): { hasError: boolean } {
		return { hasError: true };
	}

	componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
		this.props.onError?.(error, errorInfo);
		console.error('Uncaught Error:', error, errorInfo);
	}

	render(): ReactNode {
		if (this.state.hasError) {
			return this.props.fallback || null;
		}

		return this.props.children;
	}
}
