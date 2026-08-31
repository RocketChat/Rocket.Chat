import { type ComponentChildren } from 'preact';

import { PopoverContext } from './PopoverContext';

export type PopoverTriggerProps = {
	children: [
		trigger: (contextValue: { pop: () => void }) => ComponentChildren,
		renderer: (popoverContext: { dismiss: () => void; triggerBounds: DOMRect; overlayBounds: DOMRect }) => ComponentChildren,
	];
	overlayProps?: any;
};

const PopoverTrigger = ({ children, ...props }: PopoverTriggerProps) => (
	<PopoverContext.Consumer>{({ open }) => children[0]({ pop: open.bind(null, children[1], props) })}</PopoverContext.Consumer>
);

export default PopoverTrigger;
