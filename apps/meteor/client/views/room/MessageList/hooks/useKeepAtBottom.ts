import { useSafeRefCallback } from '@rocket.chat/fuselage-hooks';
import type { MutableRefObject } from 'react';
import { useCallback, useRef } from 'react';

// This hook is responsible for keeping the message list at the bottom despite any size changes to the container.
// Some examples of when this is needed are:
// - When the user is at the bottom and a new message arrives, the message list will grow and we want to keep it at the bottom. (This one is already handled in another place, but this hook also does this job)
// - When the user is at the bottom and the composer grows (e.g. when typing a long message), we want to keep it at the bottom.
// - When the user is at the bottom and the window is resized, the elements might reflow.
// - When the user is at the bottom and a thread opens, the horizontal size of the container will shrink, and the elements might reflow.
// - When the user is at the bottom and a message is reacted to, the message will grow and shift the list.
// - When the user is at the bottom and a video is loading, after loading the video element can change sizes and shift the list
export const useKeepAtBottom = (isAtBottom: MutableRefObject<boolean | null>) => {
	const handleRef = useRef<(() => void) | null>(null);
	const keepAtBottomRef = useSafeRefCallback(
		useCallback(
			(node: HTMLDivElement) => {
				const listWrapper = node.firstChild;
				const observer = new ResizeObserver(() => {
					if (isAtBottom.current) {
						if (handleRef.current) {
							handleRef.current();
						}
					}
				});

				observer.observe(node);
				if (listWrapper instanceof HTMLElement) {
					observer.observe(listWrapper);
				}

				return () => {
					observer.disconnect();
				};
			},
			[isAtBottom],
		),
	);

	const setKeepAtBottom = useCallback((handle: () => void | null) => {
		handleRef.current = handle;
	}, []);

	return { keepAtBottomRef, setKeepAtBottom };
};
