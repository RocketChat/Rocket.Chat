import { css } from '@rocket.chat/css-in-js';
import { useCallback, useState } from 'react';
import type { MutableRefObject } from 'react';
import type React from 'react';

type useDateScrollReturn = {
	bubbleDate: string | undefined;
	onScroll: (refsObject: React.MutableRefObject<{ [key: number]: React.MutableRefObject<HTMLElement> }>) => void;
	style: ReturnType<typeof css>;
	showBubble: boolean;
};

export const useDateScroll = (offset = 0): useDateScrollReturn => {
	const [bubbleDate, setBubbleDate] = useState<string>();
	const [showBubble, setShowBubble] = useState(false);

	const onScroll = useCallback(
		(refsObject: MutableRefObject<{ [key: number]: MutableRefObject<HTMLElement> }>) => {
			Object.values(refsObject.current).forEach((message, i: number, arr) => {
				if (!message.current?.getBoundingClientRect() || !message.current.dataset.id) return;
				const { top } = message.current.getBoundingClientRect();
				const { id } = message.current.dataset;
				const bubbleOffset = offset + 56;

				if (top < bubbleOffset) {
					setBubbleDate(id);
				}
				if (top === bubbleOffset) {
					return setBubbleDate(id);
				}

				const previous = arr[i - 1];
				if (!previous?.current?.getBoundingClientRect() || !previous?.current.dataset.id) return;
				const { top: previousTop } = previous?.current.getBoundingClientRect();
				const { id: previousId } = previous?.current.dataset;

				if (top > bubbleOffset && previousTop < bubbleOffset) {
					return setBubbleDate(previousId);
				}
				if (top < bubbleOffset) {
					setBubbleDate(id);
				}
			});
			setShowBubble(true);
			setTimeout(() => setShowBubble(false), 2000);
		},
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

	return { bubbleDate, onScroll, style: dateBubbleStyle, showBubble };
};
