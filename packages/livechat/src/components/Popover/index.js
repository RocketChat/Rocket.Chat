import { Component, createContext } from 'preact';

import { createClassName, normalizeDOMRect } from '../helpers';
import styles from './styles.scss';

const PopoverContext = createContext();

const PopoverOverlay = ({ children, className, visible, ...props }) => (
	<div className={createClassName(styles, 'popover__overlay', { visible }, [className])} {...props}>
		{children}
	</div>
);

export class PopoverContainer extends Component {
	state = {
		renderer: null,
		expanded: false,
		currentTarget: null,
	};

	open = (renderer, props, { currentTarget } = {}) => {
		let overlayBounds;
		let triggerBounds;

		if (this.overlayRef) {
			overlayBounds = normalizeDOMRect(this.overlayRef.base.getBoundingClientRect());
		}

		if (currentTarget) {
			triggerBounds = normalizeDOMRect(currentTarget.getBoundingClientRect());
		}

	this.setState({ renderer, ...props, overlayBounds, triggerBounds, currentTarget, expanded: true });
	};

	dismiss = () => {
		this.setState({ renderer: null, overlayBounds: null, triggerBounds: null, currentTarget: null, expanded: false });
	};

	handleOverlayGesture = ({ currentTarget, target }) => {
		if (currentTarget !== target) {
			return;
		}

		this.dismiss();
	};

	handleKeyDown = ({ e }) => {
		const { key } = e;
		if (key !== 'Escape') {
			return;
		}

		this.state.currentTarget.focus();
		this.dismiss();
		e.stopPropagation();
	};

	handleOverlayRef = (ref) => {
		this.overlayRef = ref;
	};

	componentDidMount() {
		this.mounted = true;
	};

	componentWillUnmount() {
		this.mounted = false;
	};

	render = ({ children }, { renderer, overlayProps, overlayBounds, triggerBounds, expanded }) => (
		<PopoverContext.Provider value={{ open: this.open, expanded }}>
			<div className={createClassName(styles, 'popover__container')}>
				{children}
				<PopoverOverlay
					ref={this.handleOverlayRef}
					onKeyDown={this.handleKeyDown}
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

export const PopoverTrigger = ({ children, ...props }) => (
	<PopoverContext.Consumer>
		{({ open, expanded }) => children[0]({ pop: open.bind(null, children[1], props), expanded })}
	</PopoverContext.Consumer>
);
