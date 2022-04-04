import { Component, ReactNode } from 'react';

export class ErrorBoundary extends Component<{}, { hasError: boolean }> {
	state = { hasError: false };

	static getDerivedStateFromError(): { hasError: boolean } {
		return { hasError: true };
	}

	render(): ReactNode {
		if (this.state.hasError) {
			return null;
		}

		return this.props.children;
	}
}
