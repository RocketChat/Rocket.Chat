import { useCallback } from 'react';
import { useFocusManager } from 'react-aria';

const isListItem = (node: EventTarget) => (node as HTMLElement).getAttribute('role') === 'listitem';

export const useRoomFilesNavigation = () => {
	const roomFilesFocusManager = useFocusManager();

	const roomFilesRef = useCallback(
		(node: HTMLDivElement) => {
			if (!node) {
				return;
			}

			node.addEventListener('keydown', (e) => {
				if (!e.target) {
					return;
				}

				if (!isListItem(e.target)) {
					return;
				}

				if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
					e.preventDefault();
					e.stopPropagation();

					if (e.key === 'ArrowUp') {
						roomFilesFocusManager?.focusPrevious({ accept: (node) => isListItem(node) });
					}

					if (e.key === 'ArrowDown') {
						roomFilesFocusManager?.focusNext({ accept: (node) => isListItem(node) });
					}
				}
			});
		},
		[roomFilesFocusManager],
	);

	return roomFilesRef;
};
