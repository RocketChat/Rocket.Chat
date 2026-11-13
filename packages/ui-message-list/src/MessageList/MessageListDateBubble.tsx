import { css } from '@rocket.chat/css-in-js';
import { Box, Bubble } from '@rocket.chat/fuselage';
import { useFormatDate } from '@rocket.chat/ui-client';
import { useCallback, useSyncExternalStore } from 'react';

import { useMessageListScroll } from './MessageListScrollContext';

const bubbleStyle = css`
	position: absolute;
	z-index: 1;
	top: 8px;
	left: 50%;
	transform: translate(-50%, var(--date-bubble-offset, 0));
	pointer-events: none;
	opacity: 1;
	transition: opacity 0.6s;

	&[data-visible='false'] {
		opacity: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`;

/**
 * Shows the day of the top of the list on every scroll, standing in for the day divider under it, pushed up by the next
 * day's divider, and fades a second after the last scroll.
 */
const MessageListDateBubble = () => {
	const formatDate = useFormatDate();
	const { dateBubbleStore } = useMessageListScroll();
	const date = useSyncExternalStore(dateBubbleStore.subscribe, () => dateBubbleStore.get().date);
	const isVisible = useSyncExternalStore(dateBubbleStore.subscribe, () => dateBubbleStore.get().isVisible);

	// The offset changes on every scroll while the next day pushes the date up: it is written without drawing again
	const offsetRef = useCallback(
		(element: HTMLElement | null) => {
			if (!element) {
				return;
			}
			const applyOffset = () => element.style.setProperty('--date-bubble-offset', `${dateBubbleStore.get().offset}px`);
			applyOffset();
			return dateBubbleStore.subscribe(applyOffset);
		},
		[dateBubbleStore],
	);

	if (!date) {
		return null;
	}

	return (
		<Box ref={offsetRef} className={bubbleStyle} data-visible={isVisible} aria-hidden='true'>
			<Bubble small secondary>
				{formatDate(date)}
			</Bubble>
		</Box>
	);
};

export default MessageListDateBubble;
