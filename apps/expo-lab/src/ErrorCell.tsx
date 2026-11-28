import { Component, type ReactNode } from 'react';
import { Text } from 'react-native';

type Props = { onError?: (error: string) => void; children: ReactNode };

export const firstLine = (error: Error) => `${error.name}: ${error.message}`.split('\n')[0].slice(0, 220);

// A component that throws must not blank the screen: the error is the finding for that component
export class ErrorCell extends Component<Props, { error?: string }> {
	state: { error?: string } = {};

	static getDerivedStateFromError(error: Error) {
		return { error: firstLine(error) };
	}

	componentDidCatch(error: Error) {
		this.props.onError?.(firstLine(error));
	}

	render() {
		if (this.state.error) return <Text style={{ color: 'crimson', fontSize: 11 }}>{this.state.error}</Text>;
		return this.props.children;
	}
}
