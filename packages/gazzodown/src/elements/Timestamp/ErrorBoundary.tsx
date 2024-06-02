import React, { Component, ReactNode } from 'react';

export class ErrorBoundary extends Component<{ fallback: React.ReactNode }, { hasError: boolean }> {
	constructor(props: { fallback: React.ReactNode }) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(): { hasError: boolean } {
		return { hasError: true };
	}

	render(): ReactNode {
		if (this.state.hasError) {
			// You can render any custom fallback UI
			return this.props.fallback;
		}

		return this.props.children;
	}
}
