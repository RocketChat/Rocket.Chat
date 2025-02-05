import { css } from '@rocket.chat/css-in-js';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import type { CSSProperties, MutableRefObject } from 'react';
import { useCallback, useRef, useState } from 'react';

import { withThrottling } from '../../../../lib/utils/highOrderFunctions';
import { useDateListController } from '../providers/DateListProvider';

type useDateScrollReturn = {
	innerRef: (node: HTMLElement | null) => void;
	bubbleRef: MutableRefObject<HTMLElement | null>;
	listStyle?: ReturnType<typeof css>;
} & BubbleDateProps;

export type BubbleDateProps = {
	bubbleDate: string | undefined;
	bubbleDateClassName?: ReturnType<typeof css>;
	showBubble: boolean;
	bubbleDateStyle?: CSSProperties;
};

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

	const callbackRef = useCallback(
		(node: HTMLElement | null) => {
			if (!node) {
				return;
			}
			const bubbleOffset = bubbleRef.current?.getBoundingClientRect().bottom || 0;

			const onScroll = (() => {
				let timeout: ReturnType<typeof setTimeout>;
				return (elements: Set<HTMLElement>) => {
					clearTimeout(timeout);

					// Gets the first non visible message date and sets the bubble date to it
					const [date, message, style] = [...elements].reduce(
						(ret, message) => {
							// Sanitize elements
							if (!message.dataset.id) {
								return ret;
							}

							const { top, height } = message.getBoundingClientRect();
							const { id } = message.dataset;

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
										zIndex: 11,
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
										zIndex: 11,
									},
								];
							}
							return ret;
						},
						[] as [string, HTMLElement, { [key: number]: string | number }?] | [],
					);

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
				onScroll(list);
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

	return {
		innerRef: callbackRef,
		bubbleRef,
		listStyle,
		bubbleDate: bubbleDate.date,
		bubbleDateStyle: bubbleDate.style,
		showBubble: Boolean(bubbleDate.show),
		bubbleDateClassName: bubbleDate.bubbleDateClassName,
	};
};
