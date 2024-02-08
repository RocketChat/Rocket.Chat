import { useCallback, useState } from 'react';
import type { MutableRefObject } from 'react';
import type React from 'react';

export const useRoomBubleDate = (
	offset = 0,
): {
	bubbleDate: string | undefined;
	onScroll: (refsObject: React.MutableRefObject<{ [key: number]: React.MutableRefObject<HTMLElement> }>) => void;
} => {
	const [bubbleDate, setBubbleDate] = useState<string>();

	const onScroll = useCallback(
		(refsObject: MutableRefObject<{ [key: number]: MutableRefObject<HTMLElement> }>) => {
			Object.values(refsObject.current).forEach((message, i: number, arr) => {
				if (!message.current?.getBoundingClientRect() || !message.current.dataset.id) return;
				const { top } = message.current.getBoundingClientRect();
				const { id } = message.current.dataset;

				if (top < offset) {
					setBubbleDate(id);
				}
				if (top === offset) {
					return setBubbleDate(id);
				}

				const previous = arr[i - 1];
				if (!previous?.current?.getBoundingClientRect() || !previous?.current.dataset.id) return;
				const { top: previousTop } = previous?.current.getBoundingClientRect();
				const { id: previousId } = previous?.current.dataset;

				if (top > offset && previousTop < offset) {
					return setBubbleDate(previousId);
				}
				if (top < offset) {
					setBubbleDate(id);
				}
			});
		},
		[offset],
	);

	return { bubbleDate, onScroll };
};
