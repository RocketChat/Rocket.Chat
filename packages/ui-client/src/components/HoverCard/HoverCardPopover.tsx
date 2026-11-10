import { Box, Popover } from '@rocket.chat/fuselage';
import type { ComponentProps, ReactNode } from 'react';
import { Suspense } from 'react';

import type { HoverCardController } from './useHoverCard';

export type HoverCardPopoverProps<TKey> = {
	hoverCard: HoverCardController<TKey>;
	placement?: ComponentProps<typeof Popover>['placement'];
	offset?: number;
	children: ReactNode;
};

const HoverCardPopover = <TKey,>({ hoverCard, placement, offset, children }: HoverCardPopoverProps<TKey>) => {
	const { shownKey, triggerRef, cardRef, popoverState } = hoverCard;

	if (shownKey === undefined) {
		return null;
	}

	return (
		// Non-modal: a modal popover would aria-hide the page and lock scroll for a card the pointer just passed over.
		// Keyed by what it shows so handing the card to another trigger repositions it over that trigger.
		<Popover key={String(shownKey)} isNonModal placement={placement} offset={offset} triggerRef={triggerRef} state={popoverState}>
			<Box ref={cardRef} tabIndex={-1}>
				<Suspense fallback={null}>{children}</Suspense>
			</Box>
		</Popover>
	);
};

export default HoverCardPopover;
