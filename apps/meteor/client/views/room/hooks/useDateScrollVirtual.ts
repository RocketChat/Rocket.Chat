import { css } from '@rocket.chat/css-in-js';
import { useSafely } from '@rocket.chat/fuselage-hooks';
import type { MutableRefObject } from 'react';
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
	bubbleDateStyle?: React.CSSProperties;
};

const getEdgeDateInfo = (elements: Set<HTMLElement>) => {
	const elementList = [...elements];
	let negativeOffset = 0;
	let positiveOffset = Infinity;
	let prev: HTMLElement | null = null;
	let next: HTMLElement | null = null;
	let show = true;
	let hide = false;
	const offset = -70; // TODO: clear magic offset making it relative to appropriate header elements

	for (let i = 0; i < elementList.length; i += 1) {
		const { top, bottom } = elementList[i].getBoundingClientRect();

		const _top = top + offset;
		const _bottom = bottom + offset;

		if (_top >= 0) {
			if (_top < positiveOffset) {
				positiveOffset = _top;
				next = elementList[i];
			}
			continue;
		}

		if (!negativeOffset || _bottom > negativeOffset) {
			negativeOffset = _bottom;
			prev = elementList[i];
		}
	}

	const date = prev?.dataset.id ? new Date(prev?.dataset.id).toISOString() : null;

	if (positiveOffset < 30) {
		show = false;
	}

	if (negativeOffset > 30) {
		hide = true;
		show = false;
	}

	return {
		date,
		prev,
		next,
		show,
		hide,
	};
};

export const useDateScrollVirtual = (margin = 8): useDateScrollReturn => {
	const [bubbleDate, setBubbleDate] = useSafely(
		useState<{
			date: string;
			show: boolean;
			hide: boolean;
			style?: React.CSSProperties;
			bubbleDateClassName?: ReturnType<typeof css>;
			offset: number;
		}>({
			date: '',
			show: false,
			hide: false,
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

					const { date, prev, show, hide } = getEdgeDateInfo(elements);

					const style: React.CSSProperties = {
						position: 'absolute',
						top: `${margin}px`,
						left: 'calc(50% - 2px)',
						translate: '-50%',
						zIndex: 11,
					};

					// We always keep the previous date if we don't have a new one, so when the bubble disappears it doesn't flicker
					setBubbleDate((current) => ({
						...current,
						date: '',
						...(date && { date }),
						show,
						hide,
						style,
						bubbleDateClassName: css`
							opacity: 0;
							transition: opacity 75ms;
							&.bubble-visible {
								opacity: 1;
							}
						`,
					}));

					if (prev) {
						const { top } = prev.getBoundingClientRect();
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

			// node.addEventListener('scroll', fn, { passive: true });
		},
		[list, margin, setBubbleDate],
	);

	const listStyle = undefined;

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
