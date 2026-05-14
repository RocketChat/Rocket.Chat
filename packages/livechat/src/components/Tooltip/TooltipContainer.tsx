import { Component, type ComponentChildren } from 'preact';

import Tooltip, { type Placement } from './Tooltip';
import { TooltipContext } from './TooltipContext';

export type TooltipContainerProps = {
	children: any;
};

type TooltipContainerState = {
	tooltip: any;
	activeChild: number | null;
	event: any;
	placement: Placement;
	content?: ComponentChildren;
};

class TooltipContainer extends Component<TooltipContainerProps, TooltipContainerState> {
	override state: TooltipContainerState = {
		tooltip: null,
		activeChild: null,
		event: null,
		placement: null,
	};

	showTooltip = (
		event: any,
		{ content, placement = 'bottom', childIndex }: { content: any; placement?: Placement; childIndex: number | null },
	) => {
		const triggerBounds = event.target.getBoundingClientRect();
		this.setState({
			tooltip: (
				<Tooltip floating placement={placement} triggerBounds={triggerBounds}>
					{content}
				</Tooltip>
			),
			activeChild: childIndex,
			event,
			placement,
			content,
		});
	};

	hideTooltip = () => {
		this.setState({ tooltip: null });
	};

	UNSAFE_componentWillReceiveProps(props: TooltipContainerProps) {
		if (this.state.tooltip) {
			const activeChildren = props?.children?.props?.children[this.state.activeChild ?? 0];
			if (activeChildren && activeChildren.props.content !== this.state.content) {
				this.showTooltip(this.state.event, {
					content: activeChildren.props.content,
					placement: this.state.placement,
					childIndex: this.state.activeChild,
				});
			}
		}
	}

	render({ children }: TooltipContainerProps) {
		return (
			<TooltipContext.Provider value={{ ...this.state, showTooltip: this.showTooltip, hideTooltip: this.hideTooltip }}>
				{children}
				<TooltipContext.Consumer>{({ tooltip }) => tooltip}</TooltipContext.Consumer>
			</TooltipContext.Provider>
		);
	}
}

export default TooltipContainer;
