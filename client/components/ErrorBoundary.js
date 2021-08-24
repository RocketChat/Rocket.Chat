import { Component } from 'react';

export class ErrorBoundary extends Component {
	state = { hasError: false };

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	render() {
		if (this.state.hasError) {
			return null;
		}

		return this.props.children;
	}
}
