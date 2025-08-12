import { Box, Bubble } from '@rocket.chat/fuselage';
import type { Ref } from 'react';
import { forwardRef } from 'react';

import { useFormatDate } from '../../../hooks/useFormatDate';
import type { BubbleDateProps } from '../hooks/useDateScroll';

export const BubbleDate = forwardRef(function BubbleDate(
	{ bubbleDate, showBubble, bubbleDateStyle, bubbleDateClassName }: BubbleDateProps,
	ref: Ref<HTMLElement>,
) {
	const formatDate = useFormatDate();
	return (
		<Box ref={ref} position='relative' display='flex' justifyContent='center'>
			<Box className={[bubbleDateClassName, showBubble && 'bubble-visible']} style={bubbleDateStyle}>
				{bubbleDate && (
					<Bubble small secondary>
						{formatDate(bubbleDate)}
					</Bubble>
				)}
			</Box>
		</Box>
	);
});
