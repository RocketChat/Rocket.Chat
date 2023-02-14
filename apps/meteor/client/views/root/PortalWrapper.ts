import type { ReactElement, ReactNode } from 'react';
import { PureComponent } from 'react';

type PortalWrapperProps = {
	portal: ReactElement;
};

type PortalWrapperState = {
	errored: boolean;
};

class PortalWrapper extends PureComponent<PortalWrapperProps, PortalWrapperState> {
	state: PortalWrapperState = { errored: false };

	static getDerivedStateFromError(): PortalWrapperState {
		return { errored: true };
	}

	// eslint-disable-next-line @typescript-eslint/no-empty-function
	componentDidCatch(): void {}

	render(): ReactNode {
		if (this.state.errored) {
			return null;
		}

		return this.props.portal;
	}
}

export default PortalWrapper;
