import { type KeyboardEvent, useCallback } from 'react';
import { useFocusManager } from 'react-aria';

const isListItem = (node: EventTarget) =>
	(node as HTMLElement).getAttribute('role') === 'listitem' || (node as HTMLElement).getAttribute('role') === 'link';

export const useRoomNavigation = () => {
	const focusManager = useFocusManager();

	const roomListRef = useCallback(
		(node) => {
			if (!node) {
				return;
			}

			const handleKeyDown = (e: KeyboardEvent) => {
				if (!isListItem(e.target)) {
					return;
				}

				switch (e.key) {
					case 'ArrowUp':
						return focusManager.focusPrevious({ wrap: true, accept: (node) => isListItem(node) });
					case 'ArrowDown':
						return focusManager.focusNext({ wrap: true, accept: (node) => isListItem(node) });
				}
			};

			node.addEventListener('keydown', handleKeyDown);
		},
		[focusManager],
	);

	return { roomListRef };
};
