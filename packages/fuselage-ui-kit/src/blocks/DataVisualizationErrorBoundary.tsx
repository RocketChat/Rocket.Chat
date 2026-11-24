import { Component } from 'react';
import type { ReactNode } from 'react';

type DataVisualizationErrorBoundaryProps = { fallback: ReactNode; children: ReactNode };

/** Keeps a chart that fails to load or draw from taking the message with it. */
class DataVisualizationErrorBoundary extends Component<DataVisualizationErrorBoundaryProps, { failed: boolean }> {
	override state = { failed: false };

	static getDerivedStateFromError() {
		return { failed: true };
	}

	override componentDidCatch(error: unknown) {
		console.error('The data_visualization chart failed', error);
	}

	override render() {
		return this.state.failed ? this.props.fallback : this.props.children;
	}
}

export default DataVisualizationErrorBoundary;
