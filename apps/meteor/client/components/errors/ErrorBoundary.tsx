import { Component, ErrorInfo, ReactNode } from 'react';

type ErrorLevel = 'global' | 'feature' | 'component';

interface Props {
	children: ReactNode;
	level?: ErrorLevel;
	fallback?: ReactNode;
	retryable?: boolean;
}

interface State {
	hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
	state: State = {
		hasError: false,
	};

	static defaultProps = {
		level: 'component',
		retryable: true,
	};

	componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		// Log to console (later can be Sentry)
		console.error('[ErrorBoundary]', error, errorInfo);
	}

	private retry = () => {
		this.setState({ hasError: false });
	};

	render() {
		if (!this.state.hasError) {
			return this.props.children;
		}

		if (this.props.fallback) {
			return this.props.fallback;
		}

		return (
			<div style={{ padding: 16 }}>
				<p>⚠️ Something went wrong.</p>
				{this.props.retryable && (
					<button onClick={this.retry}>Retry</button>
				)}
			</div>
		);
	}
}
