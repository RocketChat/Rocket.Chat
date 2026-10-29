import { css } from '@rocket.chat/css-in-js';
import { Box, Bubble } from '@rocket.chat/fuselage';
import { useEffect, useState } from 'react';

import { useMessageListScroll } from './MessageListScrollContext';
import { DATE_BUBBLE_IDLE_MS } from './scroll/constants';
import { useFormatDate } from '../../hooks/useFormatDate';

const bubbleStyle = css`
	position: absolute;
	z-index: 1;
	top: 8px;
	left: 50%;
	transform: translateX(-50%);
	pointer-events: none;
	opacity: 1;
	transition: opacity 0.3s ease-out;

	&[data-visible='false'] {
		opacity: 0;
	}

	@media (prefers-reduced-motion: reduce) {
		transition: none;
	}
`;

/**
 * Shows the day of the topmost visible message while the viewer scrolls, and fades shortly after they stop.
 */
const MessageListDateBubble = () => {
	const formatDate = useFormatDate();
	const { dateBubble, isUserScrolling } = useMessageListScroll();
	const [isLingering, setIsLingering] = useState(false);

	useEffect(() => {
		if (isUserScrolling) {
			setIsLingering(true);
			return;
		}

		const timeout = setTimeout(() => setIsLingering(false), DATE_BUBBLE_IDLE_MS);
		return () => clearTimeout(timeout);
	}, [isUserScrolling]);

	if (!dateBubble) {
		return null;
	}

	const isVisible = (isUserScrolling || isLingering) && !dateBubble.isCovered;

	return (
		<Box className={bubbleStyle} data-visible={isVisible} aria-hidden='true'>
			<Bubble small secondary>
				{formatDate(dateBubble.date)}
			</Bubble>
		</Box>
	);
};

export default MessageListDateBubble;
