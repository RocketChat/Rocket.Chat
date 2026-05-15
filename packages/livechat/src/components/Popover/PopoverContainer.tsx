import { Component, type ComponentProps } from 'preact';

import { PopoverContext } from './PopoverContext';
import PopoverOverlay from './PopoverOverlay';
import styles from './styles.scss';
import { createClassName } from '../../helpers/createClassName';
import { normalizeDOMRect } from '../../helpers/normalizeDOMRect';

export type PopoverContainerProps = {
	children?: any;
};

type PopoverContainerState = {
	renderer:
		| null
		| ((options: {
				dismiss: () => void;
				overlayBounds?: {
					left: number;
					top: number;
					right: number;
					bottom: number;
				} | null;
				triggerBounds?: {
					left: number;
					top: number;
					right: number;
					bottom: number;
				} | null;
		  }) => any);
	overlayProps?: ComponentProps<typeof PopoverOverlay>;
	overlayBounds?: {
		left: number;
		top: number;
		right: number;
		bottom: number;
	} | null;
	triggerBounds?: {
		left: number;
		top: number;
		right: number;
		bottom: number;
	} | null;
};

class PopoverContainer extends Component<PopoverContainerProps, PopoverContainerState> {
	override state: PopoverContainerState = {
		renderer: null,
	};

	mounted = false;

	overlayRef: any = null;

	open = (
		renderer: (options: {
			dismiss: () => void;
			overlayBounds?: { left: number; top: number; right: number; bottom: number } | null;
			triggerBounds?: { left: number; top: number; right: number; bottom: number } | null;
		}) => any,
		props: ComponentProps<typeof PopoverOverlay>,
		{ currentTarget }: { currentTarget?: HTMLElement | null } = {},
	) => {
		let overlayBounds;
		let triggerBounds;

		if (this.overlayRef) {
			overlayBounds = normalizeDOMRect(this.overlayRef.base.getBoundingClientRect());
		}

		if (currentTarget) {
			triggerBounds = normalizeDOMRect(currentTarget.getBoundingClientRect());
		}

		this.setState({ renderer, ...props, overlayBounds, triggerBounds });
	};

	dismiss = () => {
		this.setState({ renderer: null, overlayBounds: null, triggerBounds: null });
	};

	handleOverlayGesture = ({ currentTarget, target }: Event) => {
		if (currentTarget !== target) {
			return;
		}

		this.dismiss();
	};

	handleKeyDown = ({ key }: KeyboardEvent) => {
		if (key !== 'Escape') {
			return;
		}

		this.dismiss();
	};

	handleOverlayRef = (ref: any) => {
		this.overlayRef = ref;
	};

	override componentDidMount() {
		this.mounted = true;
		window.addEventListener('keydown', this.handleKeyDown, false);
	}

	override componentWillUnmount() {
		this.mounted = false;
		window.removeEventListener('keydown', this.handleKeyDown, false);
	}

	render = ({ children }: PopoverContainerProps, { renderer, overlayProps, overlayBounds, triggerBounds }: PopoverContainerState) => (
		<PopoverContext.Provider value={{ open: this.open }}>
			<div className={createClassName(styles, 'popover__container')}>
				{children}
				<PopoverOverlay
					ref={this.handleOverlayRef}
					onMouseDown={this.handleOverlayGesture}
					onTouchStart={this.handleOverlayGesture}
					visible={!!renderer}
					{...overlayProps}
				>
					{renderer ? renderer({ dismiss: this.dismiss, overlayBounds, triggerBounds }) : null}
				</PopoverOverlay>
			</div>
		</PopoverContext.Provider>
	);
}

export default PopoverContainer;
