import { css } from '@rocket.chat/css-in-js';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import { useCallback, useState } from 'react';

import { withThrottling } from '../../../../lib/utils/highOrderFunctions';
import { useDateListController } from '../providers/DateListProvider';

type useDateScrollReturn = {
	bubbleDate: string | undefined;
	innerRef: (node: HTMLElement | null) => void;
	callbackBubbleRef: (node: HTMLElement | null) => void;
	className?: ReturnType<typeof css>;
	showBubble: boolean;
	listStyle?: ReturnType<typeof css>;
	style?: React.CSSProperties;
};

export const useDateScroll = (margin = 8): useDateScrollReturn => {
	const [bubbleDate, setBubbleDate] = useSafely(
		useState<{
			date: string;
			show: boolean;
			style?: React.CSSProperties;
			className?: ReturnType<typeof css>;
			offset: number;
		}>({
			date: '',
			show: false,
			style: undefined,
			className: undefined,
			offset: 0,
		}),
	);

	const { list } = useDateListController();

	const callbackBubbleRef = useCallback(
		(node: HTMLElement | null) => {
			if (!node) {
				return;
			}
			setBubbleDate((current) => ({
				...current,
				offset: node.getBoundingClientRect().top,
			}));
		},
		[setBubbleDate],
	);

	const callbackRef = useCallback(
		(node: HTMLElement | null) => {
			if (!node) {
				return;
			}
			const bubbleOffset = bubbleDate.offset;

			const onScroll = (() => {
				let timeout: ReturnType<typeof setTimeout>;
				return (elements: Set<HTMLElement>) => {
					clearTimeout(timeout);

					// Gets the first non visible message date and sets the bubble date to it
					const [date, message, style] = [...elements].reduce((ret, message) => {
						// Sanitize elements
						if (!message.dataset.id) {
							return ret;
						}

						const { top, height } = message.getBoundingClientRect();
						const { id } = message.dataset;
						console.log('top divider', top, 'offset bubble', bubbleOffset);

						// if the bubble if between the divider and the top, position it at the top of the divider
						if (top > bubbleOffset && top < bubbleOffset + height) {
							return [
								ret[0] || new Date(id).toISOString(),
								ret[1] || message,
								{
									position: 'absolute',
									top: `${top - height - bubbleOffset + margin}px`,
									left: ' 50%',
									translate: '-50%',
									zIndex: 1,
								},
							];
						}

						if (top < bubbleOffset + height) {
							return [
								new Date(id).toISOString(),
								message,
								{
									position: 'absolute',
									top: `${margin}px`,
									left: ' 50%',
									translate: '-50%',
									zIndex: 1,
								},
							];
						}
						return ret;
					}, [] as [string, HTMLElement, { [key: number]: string | number }?] | []);

					// We always keep the previous date if we don't have a new one, so when the bubble disappears it doesn't flicker
					setBubbleDate((current) => ({
						...current,
						date: '',
						...(date && { date }),
						show: Boolean(date),
						style,
						className: css`
							opacity: 0;
							transition: opacity 0.6s;
							&.bubble-visible {
								opacity: 1;
							}
						`,
					}));

					if (message) {
						const { top } = message.getBoundingClientRect();
						if (top < bubbleOffset && top > 0) {
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
				// const offset = node.getBoundingClientRect().top;
				onScroll(list);
			});

			node.addEventListener('scroll', fn, { passive: true });
		},
		[bubbleDate, list, margin, setBubbleDate],
	);

	const listStyle = undefined;
	// bubbleDate.show && bubbleDate.date
	// 	? css`
	// 			position: relative;
	// 			& [data-time='${bubbleDate.date.replaceAll(/[-T:.]/g, '').substring(0, 8)}'] {
	// 				opacity: 0;
	// 			}
	// 	  `
	// 	: undefined;

	// console.log('bubbleDate', bubbleDate);
	return {
		innerRef: callbackRef,
		callbackBubbleRef,
		listStyle,
		bubbleDate: bubbleDate.date,
		style: bubbleDate.style,
		showBubble: Boolean(bubbleDate.show),
		className: bubbleDate.className,
	};
};
