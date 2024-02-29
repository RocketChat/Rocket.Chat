import { css } from '@rocket.chat/css-in-js';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useCallback, useState } from 'react';

import { withThrottling } from '../../../../lib/utils/highOrderFunctions';

type useDateScrollReturn = {
	bubbleDate: string | undefined;
	onScroll: (list: Set<HTMLElement>) => void;
	style: ReturnType<typeof css>;
	showBubble: boolean;
	listStyle?: ReturnType<typeof css>;
};

export const useDateScroll = (offset = 0): useDateScrollReturn => {
	const [bubbleDate, setBubbleDate] = useSafely(
		useState<{
			date: string;
			show: boolean;
		}>({
			date: '',
			show: false,
		}),
	);

	const onScroll = useCallback(
		withThrottling({ wait: 30 })(
			(() => {
				let timeout: ReturnType<typeof setTimeout>;
				return (elements: Set<HTMLElement>) => {
					clearTimeout(timeout);

					const bubbleOffset = offset + 56;
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
					}));

					if (message) {
						const { top } = message.getBoundingClientRect();

						if (top - offset > 0) {
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
			})(),
		),
		[offset],
	);

	const dateBubbleStyle = css`
		position: absolute;
		top: ${offset}px;
		left: 50%;
		translate: -50%;
		z-index: 1;

		opacity: 0;
		transition: opacity 0.6s;

		&.bubble-visible {
			opacity: 1;
		}
	`;

	const listStyle =
		bubbleDate.show && bubbleDate.date
			? css`
					& [data-time='${bubbleDate.date.replaceAll(/[-T:.]/g, '').substring(0, 8)}'] {
						opacity: 0;
					}
			  `
			: undefined;

	return { listStyle, bubbleDate: bubbleDate.date, onScroll, style: dateBubbleStyle, showBubble: Boolean(bubbleDate.show) };
};
