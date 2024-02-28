import { css } from '@rocket.chat/css-in-js';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useCallback, useState } from 'react';
import type { MutableRefObject } from 'react';

import { withThrottling } from '../../../../lib/utils/highOrderFunctions';

type useDateScrollReturn = {
	bubbleDate: string | undefined;
	onScroll: (refsObject: MutableRefObject<{ [key: number]: MutableRefObject<HTMLElement> }>) => void;
	style: ReturnType<typeof css>;
	showBubble: boolean;
};
function fromRefObjectToArray<T extends MutableRefObject<{ [key: number]: MutableRefObject<HTMLElement> }>>(
	fn: (elements: MutableRefObject<HTMLElement>[]) => void,
) {
	return (refsObject: T) => {
		fn(Object.values(refsObject.current));
	};
}

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
		withThrottling({ wait: 50 })(
			fromRefObjectToArray(
				(() => {
					let timeout: ReturnType<typeof setTimeout>;
					return (elements) => {
						clearTimeout(timeout);

						// Gets the first non visible message date and sets the bubble date to it
						const date = elements.reduce((date, message) => {
							// Sanitize elements
							if (!message.current?.dataset.id) {
								return date;
							}

							const { top } = message.current.getBoundingClientRect();
							const { id } = message.current.dataset;
							const bubbleOffset = offset + 56;

							if (top <= bubbleOffset) {
								return id;
							}
							return date;
						}, undefined as string | undefined);

						// We always keep the previous date if we don't have a new one, so when the bubble disappears it doesn't flicker
						setBubbleDate(() => ({
							date: '',
							...(date && { date }),
							show: Boolean(date),
						}));

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

	return { bubbleDate: bubbleDate.date, onScroll, style: dateBubbleStyle, showBubble: Boolean(bubbleDate.show) };
};
