import { css } from '@rocket.chat/css-in-js';
import { Box, Bubble } from '@rocket.chat/fuselage';
import type { Ref } from 'react';
import { forwardRef, useSyncExternalStore } from 'react';

import { useFormatDate } from '../../../hooks/useFormatDate';
import type { BubbleDateStore } from '../hooks/useDateScroll';

const bubbleDateClassName = css`
	opacity: 0;
	transition: opacity 0.6s;
	&.bubble-visible {
		opacity: 1;
	}
`;

type BubbleDateProps = {
	store: BubbleDateStore;
	/** Selector of the list whose day divider is hidden while the bubble stands in for it. */
	dividerScope?: string;
};

export const BubbleDate = forwardRef(function BubbleDate({ store, dividerScope }: BubbleDateProps, ref: Ref<HTMLElement>) {
	const formatDate = useFormatDate();
	const { date, show, style, showDivider } = useSyncExternalStore(store.subscribe, store.get);

	const hideDivider = dividerScope && show && date && !showDivider;

	return (
		<>
			{hideDivider && <style>{`${dividerScope} [data-time='${date.replaceAll(/[-T:.]/g, '').substring(0, 8)}'] { opacity: 0; }`}</style>}
			<Box ref={ref} position='relative' display='flex' justifyContent='center'>
				<Box className={[bubbleDateClassName, show && 'bubble-visible']} style={style}>
					{date && (
						<Bubble small secondary>
							{formatDate(date)}
						</Bubble>
					)}
				</Box>
			</Box>
		</>
	);
});
