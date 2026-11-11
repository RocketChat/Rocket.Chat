import type { ReactNode, RefObject } from 'react';
import { useRef } from 'react';
import type { AriaPopoverProps } from 'react-aria';
import { usePopover, DismissButton, Overlay } from 'react-aria';
import type { OverlayTriggerState } from 'react-stately';

import { useOwnerDocument } from '../../contexts';

export type PopoverProps = Omit<AriaPopoverProps, 'popoverRef'> & {
	children: ReactNode;
	state: OverlayTriggerState;
	portalContainer?: Element;
	popoverRef?: RefObject<HTMLDivElement | null>;
};

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
