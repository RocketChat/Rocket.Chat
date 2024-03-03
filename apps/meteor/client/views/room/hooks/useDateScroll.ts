import { css } from '@rocket.chat/css-in-js';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useCallback, useState } from 'react';

import { withThrottling } from '../../../../lib/utils/highOrderFunctions';
import { useDateListController } from '../providers/DateListProvider';

type useDateScrollReturn = {
	bubbleDate: string | undefined;
	callbackRef: (node: HTMLElement | null) => void;
	style?: ReturnType<typeof css>;
	showBubble: boolean;
	listStyle?: ReturnType<typeof css>;
};

export const useDateScroll = (margin = 8): useDateScrollReturn => {
	const [bubbleDate, setBubbleDate] = useSafely(
		useState<{
			date: string;
			show: boolean;
			style?: ReturnType<typeof css>;
		}>({
			date: '',
			show: false,
			style: undefined,
		}),
	);

	const { list } = useDateListController();

	const callbackRef = useCallback(
		(node: HTMLElement | null) => {
			if (!node) {
				return;
			}
			const onScroll = (() => {
				let timeout: ReturnType<typeof setTimeout>;
				return (elements: Set<HTMLElement>, offset: number) => {
					clearTimeout(timeout);

					const bubbleOffset = offset;

					// Gets the first non visible message date and sets the bubble date to it
					const [date, message] = [...elements].reduce((ret, message) => {
						// Sanitize elements
						if (!message.dataset.id) {
							return ret;
						}

						const { top } = message.getBoundingClientRect();
						const { id } = message.dataset;

						if (top < bubbleOffset) {
							// Remove T - . : from the date
							return [new Date(id).toISOString(), message];
						}
						return ret;
					}, [] as [string, HTMLElement] | []);

					// We always keep the previous date if we don't have a new one, so when the bubble disappears it doesn't flicker

					setBubbleDate(() => ({
						date: '',
						...(date && { date }),
						show: Boolean(date),
						style: css`
							position: absolute;
							top: ${margin}px;
							left: 50%;
							translate: -50%;
							z-index: 1;

							opacity: 0;
							transition: opacity 0.6s;

							&.bubble-visible {
								opacity: 1;
							}
						`,
					}));

					if (message) {
						const { top } = message.getBoundingClientRect();
						if (top < offset && top > 0) {
							return;
						}
					}

					timeout = setTimeout(
						() =>
							setBubbleDate((current) => ({
								...current,
								show: false,
							})),
						1000,
					);
				};
			})();
			const fn = withThrottling({ wait: 30 })(() => {
				const offset = node.getBoundingClientRect().top;
				onScroll(list, offset);
			});

			node.addEventListener('scroll', fn, { passive: true });
		},
		[list, margin, setBubbleDate],
	);

	const listStyle =
		bubbleDate.show && bubbleDate.date
			? css`
					position: relative;
					& [data-time='${bubbleDate.date.replaceAll(/[-T:.]/g, '').substring(0, 8)}'] {
						opacity: 0;
					}
			  `
			: undefined;

	return { callbackRef, listStyle, bubbleDate: bubbleDate.date, style: bubbleDate.style, showBubble: Boolean(bubbleDate.show) };
};
