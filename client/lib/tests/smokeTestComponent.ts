import { it, describe, beforeEach, afterEach, Done } from 'mocha';
import { Component, ComponentType, createElement, ReactNode } from 'react';
import { render } from 'react-dom';
import { act } from 'react-dom/test-utils';

class MochaErrorBoundary extends Component<{ done: Done }, { error: Error | null }> {
	constructor(props: { done: Done }) {
		super(props);
		this.state = { error: null };
	}

	static getDerivedStateFromError(error: Error): { error: Error } {
		return { error };
	}

	componentDidMount(): void {
		this.props.done(this.state.error);
	}

	render(): ReactNode {
		if (this.state.error) {
			return null;
		}

		return this.props.children;
	}
}

export const smokeTestComponent = <P>(component: ComponentType<P>, props?: P): void => {
	const testSuiteName = component.displayName ?? component.name ?? 'Anonymous component';

	let rootContainer: Element | null;

	beforeEach(() => {
		rootContainer = document.createElement('div');
		document.body.appendChild(rootContainer);
	});

	afterEach(() => {
		if (!rootContainer) {
			return;
		}

		document.body.removeChild(rootContainer);
		rootContainer = null;
	});

	describe(testSuiteName, () => {
		it('mounts', (done) => {
			act(() => {
				render(
					createElement(MochaErrorBoundary, { done }, createElement(component, props)),
					rootContainer,
				);
			});
		});
	});
};
