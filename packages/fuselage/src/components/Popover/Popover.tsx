import type { ReactNode, RefObject } from 'react';
import { useRef } from 'react';
import type { AriaPopoverProps } from 'react-aria';
import { usePopover, DismissButton, Overlay } from 'react-aria';
import type { OverlayTriggerState } from 'react-stately';

import { useOwnerDocument } from '../../contexts';

export type PopoverProps = Omit<AriaPopoverProps, 'popoverRef'> & {
	children: ReactNode;
	/** Open state from `useOverlayTriggerState`, shared with the trigger; the popover closes through it. */
	state: OverlayTriggerState;
	/** Element the popover renders into, in place of the body of the document it belongs to. */
	portalContainer?: Element;
	/** Ref to the popover element, for a caller that measures it or tells clicks inside it from clicks outside. */
	popoverRef?: RefObject<HTMLDivElement | null>;
};

/**
 * Floats its content above the page next to a trigger while `state` is open, and closes it when the user presses
 * Escape or clicks outside. It has no look of its own: the content brings its surface, such as a `PopoverSurface`.
 */
function Popover({ portalContainer, popoverRef: popoverRefProp, ...props }: PopoverProps) {
	const fallbackRef = useRef<HTMLDivElement>(null);
	const popoverRef = popoverRefProp ?? fallbackRef;
	const { state, children, isNonModal } = props;

	const { document: ownerDocument } = useOwnerDocument();

	const { popoverProps, underlayProps } = usePopover(
		{
			...props,
			popoverRef,
			boundaryElement: ownerDocument?.body,
		},
		state,
	);

	return (
		<Overlay portalContainer={portalContainer ?? ownerDocument?.body}>
			{!isNonModal && <div {...underlayProps} />}
			<div {...popoverProps} ref={popoverRef}>
				{!isNonModal && <DismissButton onDismiss={state.close} />}
				{children}
				<DismissButton onDismiss={state.close} />
			</div>
		</Overlay>
	);
}

export default Popover;
