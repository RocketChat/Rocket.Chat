import { type ComponentChildren, createContext } from 'preact';

import type { Placement } from './Tooltip';

export const TooltipContext = createContext<{
	tooltip: any;
	activeChild: number | null;
	event: any;
	placement: Placement;
	content?: ComponentChildren;
	showTooltip: (
		event: any,
		{
			content,
			placement,
			childIndex,
		}: {
			content: any;
			placement?: Placement;
			childIndex: number | null;
		},
	) => void;
	hideTooltip: () => void;
}>({
	activeChild: null,
	event: null,
	placement: null,
	showTooltip: () => {
		// noop
	},
	hideTooltip: () => {
		// noop
	},
	tooltip: null,
});
