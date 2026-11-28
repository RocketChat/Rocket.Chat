import type { IMessage } from '@rocket.chat/core-typings';
import { useDebouncedCallback } from '@rocket.chat/fuselage-hooks';
import type { MutableRefObject } from 'react';
import { useCallback, useRef, useState } from 'react';

import type { BubbleDateStore } from '../BubbleDate/bubbleDateStore';
import { createBubbleDateStore, initialBubbleDateState } from '../BubbleDate/bubbleDateStore';
import { useDateListController } from '../providers/DateListProvider';

type useDateScrollReturn = {
	handleDateScroll: (topMessage: IMessage | undefined, offset: number) => void;
	bubbleRef: MutableRefObject<HTMLElement | null>;
	bubbleDateStore: BubbleDateStore;
	/** Brings the bubble back to its initial state, dropping any pending update for the list it was showing. */
	resetBubbleDate: () => void;
};

// The threshold in pixels to consider a date divider as "visible" when scrolling.
// The divider being a few pixels above the top of the viewport is safe, as it is always contained inside a message
const DATE_DIVIDER_VISIBILITY_THRESHOLD = 100;

type Matched = [date: string, divider: HTMLElement | undefined, style: { [key: string]: string | number }, showDivider: boolean] | [];

export const useDateScroll = (margin = 8): useDateScrollReturn => {
	const [bubbleDateStore] = useState(createBubbleDateStore);
	const setBubbleDate = bubbleDateStore.set;

	const { list } = useDateListController();

	const bubbleRef = useRef<HTMLElement>(null);

	const hideBubbleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const handleDateScroll = useDebouncedCallback(
		(topMessage: IMessage | undefined, offset: number) => {
			if (hideBubbleTimeoutRef.current) {
				clearTimeout(hideBubbleTimeoutRef.current);
				hideBubbleTimeoutRef.current = null;
			}

			const bubbleBottom = bubbleRef.current?.getBoundingClientRect().bottom || 0;

			// Gets the first non visible message date and sets the bubble date to it
			let matched: Matched = [...list].reduce<Matched>((ret, divider) => {
				const { top: dividerTop, height: dividerHeight } = divider.getBoundingClientRect();
				// Some dividers might be kept in the DOM if the "new day" message has a file attached
				// So we check if they are actually visible to avoid showing old dates in the bubble
				// We also need the parent since it has the actual offset inside the scroll container
				const parentOffsetTop = divider.parentElement?.offsetTop;
				const parentSafeOffset = parentOffsetTop !== undefined ? parentOffsetTop + DATE_DIVIDER_VISIBILITY_THRESHOLD : 0;

				// Sanitize elements
				if (!divider.dataset.id || parentSafeOffset < offset) {
					return ret;
				}

				const { id } = divider.dataset;

				// if the bubble if between the divider and the top, position it at the top of the divider
				if (dividerTop > bubbleBottom && dividerTop < bubbleBottom + dividerHeight) {
					// if there's no previous date it means the previous divider is not mounted anymore, so we use the message date or fallback to the divider date as a last resort
					const date = ret[0] ? ret[0] : (topMessage && new Date(topMessage.ts).toISOString()) || new Date(id).toISOString();
					return [
						date,
						ret[1] || divider,
						{
							position: 'absolute',
							top: `${dividerTop - dividerHeight - bubbleBottom + margin}px`,
							left: ' 50%',
							translate: '-50%',
							zIndex: 11,
						},
						true,
					];
				}

				if (dividerTop < bubbleBottom + dividerHeight) {
					return [
						new Date(id).toISOString(),
						divider,
						{
							position: 'absolute',
							top: `${margin}px`,
							left: ' 50%',
							translate: '-50%',
							zIndex: 11,
						},
						false,
					];
				}
				return ret;
			}, []);

			// Fallback: no divider rendered near the top (virtualized out) → use the top visible message's date, pinned
			if (matched.length === 0 && topMessage) {
				matched = [
					new Date(topMessage.ts).toISOString(),
					undefined,
					{
						position: 'absolute',
						top: `${margin}px`,
						left: ' 50%',
						translate: '-50%',
						zIndex: 11,
					},
					true,
				];
			}

			const [date, divider, style, showDivider] = matched;

			// We always keep the previous date if we don't have a new one, so when the bubble disappears it doesn't flicker
			setBubbleDate((current) => ({
				...current,
				date: '',
				...(date && { date }),
				show: Boolean(date),
				style,
				showDivider: showDivider ?? true,
			}));

			if (divider) {
				const { top } = divider.getBoundingClientRect();
				if (top < bubbleBottom && top > 0) {
					return;
				}
			}

			hideBubbleTimeoutRef.current = setTimeout(
				() =>
					setBubbleDate((current) => ({
						...current,
						show: false,
						showDivider: true,
					})),
				1000,
			);
		},
		5,
		[list, margin, setBubbleDate],
	);

	const cancelDateScroll = handleDateScroll.cancel;

	const resetBubbleDate = useCallback(() => {
		cancelDateScroll();
		if (hideBubbleTimeoutRef.current) {
			clearTimeout(hideBubbleTimeoutRef.current);
			hideBubbleTimeoutRef.current = null;
		}
		setBubbleDate(() => initialBubbleDateState);
	}, [cancelDateScroll, setBubbleDate]);

	return { handleDateScroll, bubbleRef, bubbleDateStore, resetBubbleDate };
};
