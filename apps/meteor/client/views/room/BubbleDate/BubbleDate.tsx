import { css } from '@rocket.chat/css-in-js';
import { Box, Bubble } from '@rocket.chat/fuselage';
import type { Ref } from 'react';
import { forwardRef } from 'react';

import type { BubbleDateStore } from './bubbleDateStore';
import { useBubbleDate } from './bubbleDateStore';
import { useFormatDate } from '../../../hooks/useFormatDate';

const bubbleDateClassName = css`
	opacity: 0;
	transition: opacity 0.6s;
	&.bubble-visible {
		opacity: 1;
	}
`;

type BubbleDateProps = {
	store: BubbleDateStore;
};

export const BubbleDate = forwardRef(function BubbleDate({ store }: BubbleDateProps, ref: Ref<HTMLElement>) {
	const formatDate = useFormatDate();
	const { date, show, style } = useBubbleDate(store);

	return (
		<Box ref={ref} position='relative' display='flex' justifyContent='center'>
			<Box className={[bubbleDateClassName, show && 'bubble-visible']} style={style}>
				{date && (
					<Bubble small secondary>
						{formatDate(date)}
					</Bubble>
				)}
			</Box>
		</Box>
	);
});
