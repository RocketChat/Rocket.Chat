import type { IMessage } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { useDebouncedCallback, useSafely } from '@rocket.chat/fuselage-hooks';
import type { CSSProperties, MutableRefObject } from 'react';
import { useRef, useState } from 'react';

import { useDateListController } from '../providers/DateListProvider';

type useDateScrollReturn = {
	handleDateScroll: (topMessage: IMessage | undefined, offset: number) => void;
	bubbleRef: MutableRefObject<HTMLElement | null>;
	listStyle?: ReturnType<typeof css>;
} & BubbleDateProps;

export type BubbleDateProps = {
	bubbleDate: string | undefined;
	bubbleDateClassName?: ReturnType<typeof css>;
	showBubble: boolean;
	bubbleDateStyle?: CSSProperties;
};

// The threshold in pixels to consider a date divider as "visible" when scrolling.
// The divider being a few pixels above the top of the viewport is safe, as it is always contained inside a message
const DATE_DIVIDER_VISIBILITY_THRESHOLD = 100;

export const useDateScroll = (margin = 8): useDateScrollReturn => {
	const [bubbleDate, setBubbleDate] = useSafely(
		useState<{
			date: string;
			show: boolean;
			style?: CSSProperties;
			bubbleDateClassName?: ReturnType<typeof css>;
			offset: number;
		}>({
			date: '',
			show: false,
			style: undefined,
			bubbleDateClassName: undefined,
			offset: 0,
		}),
	);

	const { list } = useDateListController();

	const bubbleRef = useRef<HTMLElement>(null);

	const hideBubbleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const handleDateScroll = useDebouncedCallback(
		(topMessage: IMessage | undefined, offset: number) => {
			if (hideBubbleTimeoutRef.current) {
				clearTimeout(hideBubbleTimeoutRef.current);
				hideBubbleTimeoutRef.current = null;
			}

			const bubbleOffset = bubbleRef.current?.getBoundingClientRect().bottom || 0;

			type Matched = [string, HTMLElement | undefined, { [key: string]: string | number }?] | [];
			// Gets the first non visible message date and sets the bubble date to it
			let matched: Matched = [...list].reduce<Matched>((ret, divider) => {
				const { top, height } = divider.getBoundingClientRect();
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
				if (top > bubbleOffset && top < bubbleOffset + height) {
					return [
						ret[0] || new Date(id).toISOString(),
						ret[1] || divider,
						{
							position: 'absolute',
							top: `${top - height - bubbleOffset + margin}px`,
							left: ' 50%',
							translate: '-50%',
							zIndex: 11,
						},
					];
				}

				if (top < bubbleOffset + height) {
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
				];
			}

			const [date, divider, style] = matched;

			// We always keep the previous date if we don't have a new one, so when the bubble disappears it doesn't flicker
			setBubbleDate((current) => ({
				...current,
				date: '',
				...(date && { date }),
				show: Boolean(date),
				style,
				bubbleDateClassName: css`
					opacity: 0;
					transition: opacity 0.6s;
					&.bubble-visible {
						opacity: 1;
					}
				`,
			}));

			if (divider) {
				const { top } = divider.getBoundingClientRect();
				if (top < bubbleOffset && top > 0) {
					return;
				}
			}

			hideBubbleTimeoutRef.current = setTimeout(
				() =>
					setBubbleDate((current) => ({
						...current,
						show: false,
					})),
				1000,
			);
		},
		5,
		[list, margin, setBubbleDate],
	);
	// TODO: Make the chip "gliding" work with the new sistem.
	// const listStyle =
	// 	bubbleDate.show && bubbleDate.date
	// 		? css`
	// 				position: relative;
	// 				& [data-time='${bubbleDate.date.replaceAll(/[-T:.]/g, '').substring(0, 8)}'] {
	// 					opacity: 0;
	// 				}
	// 			`
	// 		: undefined;

	const listStyle = undefined;

	return {
		handleDateScroll,
		bubbleRef,
		listStyle,
		bubbleDate: bubbleDate.date,
		bubbleDateStyle: bubbleDate.style,
		showBubble: Boolean(bubbleDate.show),
		bubbleDateClassName: bubbleDate.bubbleDateClassName,
	};
};
