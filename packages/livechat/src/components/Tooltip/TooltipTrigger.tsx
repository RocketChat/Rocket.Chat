import { toChildArray, cloneElement, ComponentChildren, VNode } from 'preact';
import { FocusEvent, MouseEvent } from 'preact/compat';

import type { Placement } from './Tooltip';
import { TooltipContext } from './TooltipContext';

export type TooltipTriggerProps = {
	content: ComponentChildren;
	placement?: Placement;
	children: ComponentChildren;
};

const TooltipTrigger = ({ children, content, placement }: TooltipTriggerProps) => (
	<TooltipContext.Consumer>
		{({ showTooltip, hideTooltip }) =>
			toChildArray(children).map((child, index) =>
				cloneElement(child as VNode, {
					onMouseEnter: (event: MouseEvent<any>) => showTooltip(event, { content, placement, childIndex: index }),
					onMouseLeave: () => hideTooltip(),
					onFocusCapture: (event: FocusEvent<any>) => showTooltip(event, { content, placement, childIndex: index }),
					onBlurCapture: () => hideTooltip(),
					content,
				}),
			)
		}
	</TooltipContext.Consumer>
);

export default TooltipTrigger;
