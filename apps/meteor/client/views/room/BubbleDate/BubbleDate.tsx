import type { css } from '@rocket.chat/css-in-js';
import { Box, Bubble } from '@rocket.chat/fuselage';
import type { CSSProperties, RefAttributes } from 'react';

import { useFormatDate } from '../../../hooks/useFormatDate';

export type BubbleDateProps = {
	bubbleDate: string | undefined;
	bubbleDateClassName?: ReturnType<typeof css>;
	showBubble: boolean;
	bubbleDateStyle?: CSSProperties;
} & RefAttributes<HTMLElement>;

export const BubbleDate = ({ bubbleDate, showBubble, bubbleDateStyle, bubbleDateClassName, ref }: BubbleDateProps) => {
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
};
