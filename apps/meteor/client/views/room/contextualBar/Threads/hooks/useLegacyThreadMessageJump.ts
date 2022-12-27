import type { IMessage } from '@rocket.chat/core-typings';
import { useRef, useEffect } from 'react';

export const useLegacyThreadMessageJump = (
	mid: IMessage['_id'] | undefined,
	{ enabled = true, onJumpTo }: { enabled?: boolean; onJumpTo?: (mid: IMessage['_id']) => void },
) => {
	const parentRef = useRef<HTMLElement>(null);
	const onJumpToRef = useRef(onJumpTo);
	onJumpToRef.current = onJumpTo;

	useEffect(() => {
		const parent = parentRef.current;

		if (!enabled || !mid || !parent) {
			return;
		}

		const messageElement = parent.querySelector(`[data-id="${mid}"]`);
		if (!messageElement) {
			return;
		}

		messageElement.classList.add('highlight');

		const removeClass = () => {
			messageElement.classList.remove('highlight');
			messageElement.removeEventListener('animationend', removeClass);
		};
		messageElement.addEventListener('animationend', removeClass);

		setTimeout(() => {
			messageElement.scrollIntoView();
			const onJumpTo = onJumpToRef.current;
			onJumpTo?.(mid);
		}, 300);
	}, [enabled, mid, onJumpTo]);

	return { parentRef };
};
