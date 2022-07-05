import { Component, createContext } from 'preact';

import { createClassName, normalizeDOMRect } from '../helpers';
import styles from './styles.scss';


const PopoverContext = createContext();


const PopoverOverlay = ({ children, className, visible, ...props }) => (
	<div
		className={createClassName(styles, 'popover__overlay', { visible }, [className])}
		{...props}
	>
		{children}
	</div>
);


export class PopoverContainer extends Component {
	state = {
		renderer: null,
	}

	open = (renderer, props, { currentTarget } = {}) => {
		let overlayBounds;
		let triggerBounds;

		if (this.overlayRef) {
			overlayBounds = normalizeDOMRect(this.overlayRef.base.getBoundingClientRect());
		}

		if (currentTarget) {
			triggerBounds = normalizeDOMRect(currentTarget.getBoundingClientRect());
		}

		this.setState({ renderer, ...props, overlayBounds, triggerBounds });
	}

	dismiss = () => {
		this.setState({ renderer: null, overlayBounds: null, triggerBounds: null });
	}

	handleOverlayGesture = ({ currentTarget, target }) => {
		if (currentTarget !== target) {
			return;
		}

		this.dismiss();
	}

	handleKeyDown = ({ key }) => {
		switch (key) {
			case 'Enter':
				this.setTriggerElement();
				break;
			case 'Escape':
				this.state.triggerElement.focus();
				this.dismiss();
				break;
			default:
				break;
		}
	}

	handleOverlayRef = (ref) => {
		this.overlayRef = ref;
	}

	setTriggerElement = () => {
		const triggerElement = document.activeElement;
		this.setState({ ...this.state, triggerElement });
	}

	componentDidMount() {
		this.mounted = true;
		window.addEventListener('keydown', this.handleKeyDown, false);
	}

	componentWillUnmount() {
		this.mounted = false;
		window.removeEventListener('keydown', this.handleKeyDown, false);
	}

	render = ({ children }, { renderer, overlayProps, overlayBounds, triggerBounds }) => (
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
	)
}


export const PopoverTrigger = ({ children, ...props }) => (
	<PopoverContext.Consumer>
		{({ open }) => children[0]({ pop: open.bind(null, children[1], props) })}
	</PopoverContext.Consumer>
);
