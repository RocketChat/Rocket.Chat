import { cloneElement, Component, createContext, toChildArray } from 'preact';

import { createClassName } from '../helpers';
import styles from './styles.scss';


const getPositioningStyle = (placement, { left, top, right, bottom }) => {
	switch (placement) {
		case 'left':
			return {
				left: `${ left }px`,
				top: `${ (top + bottom) / 2 }px`,
			};

		case 'top':
		case 'top-left':
		case 'top-right':
			return {
				left: `${ (left + right) / 2 }px`,
				top: `${ top }px`,
			};

		case 'right':
			return {
				left: `${ right }px`,
				top: `${ (top + bottom) / 2 }px`,
			};

		case 'bottom':
		case 'bottom-left':
		case 'bottom-right':
		default:
			return {
				left: `${ (left + right) / 2 }px`,
				top: `${ bottom }px`,
			};
	}
};


export const Tooltip = ({ children, hidden = false, placement, floating = false, triggerBounds, ...props }) => (
	<div
		className={createClassName(styles, 'tooltip', { hidden, placement, floating })}
		style={floating ? getPositioningStyle(placement, triggerBounds) : {}}
		{...props}
	>
		{children}
	</div>
);


const TooltipContext = createContext();


export class TooltipContainer extends Component {
	state = {
		tooltip: null,
		activeChild: null,
		event: null,
		placement: null,
	};

	showTooltip = (event, { content, placement = 'bottom', childIndex }) => {
		const triggerBounds = event.target.getBoundingClientRect();
		this.setState({ tooltip: <Tooltip floating placement={placement} triggerBounds={triggerBounds}>{content}</Tooltip>, activeChild: childIndex, event, placement, content });
	};

	hideTooltip = () => {
		this.setState({ tooltip: null });
	};

	UNSAFE_componentWillReceiveProps(props) {
		if (this.state.tooltip) {
			const activeChildren = props?.children?.props?.children[this.state.activeChild];
			if (activeChildren && activeChildren.props.content !== this.state.content) {
				this.showTooltip(this.state.event, { content: activeChildren.props.content, placement: this.state.placement, childIndex: this.state.activeChild });
			}
		}
	}

	render({ children }) {
		return (
			<TooltipContext.Provider value={{ ...this.state, showTooltip: this.showTooltip, hideTooltip: this.hideTooltip }}>
				{children}
				<TooltipContext.Consumer>
					{({ tooltip }) => tooltip}
				</TooltipContext.Consumer>
			</TooltipContext.Provider>
		);
	}
}


export const TooltipTrigger = ({ children, content, placement }) => (
	<TooltipContext.Consumer>
		{({ showTooltip, hideTooltip }) => toChildArray(children).map((child, index) => cloneElement(child, {
			onMouseEnter: (event) => showTooltip(event, { content, placement, childIndex: index }),
			onMouseLeave: (event) => hideTooltip(event),
			onFocusCapture: (event) => showTooltip(event, { content, placement, childIndex: index }),
			onBlurCapture: (event) => hideTooltip(event),
			content,
		}))}
	</TooltipContext.Consumer>
);


export const withTooltip = (component) => {
	const TooltipConnection = ({ tooltip, ...props }) => (
		<Tooltip.Trigger content={tooltip}>
			{component(props)}
		</Tooltip.Trigger>
	);
	TooltipConnection.displayName = `withTooltip(${ component.displayName })`;

	return TooltipConnection;
};


Tooltip.Container = TooltipContainer;
Tooltip.Trigger = TooltipTrigger;


export default Tooltip;
