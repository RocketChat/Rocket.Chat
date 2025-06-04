import { useCallback, useState } from 'react';

const isListItem = (node: EventTarget) => (node as HTMLElement).getAttribute('role') === 'listitem';

export const useRoomFilesNavigation = (maxItems: number) => {
	const [focusedItem, setFocusedItem] = useState(-1);

	const roomFilesRef = useCallback(
		(node: HTMLDivElement | null) => {
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
						setFocusedItem((prev) => Math.max(0, prev - 1));
					}

					if (e.key === 'ArrowDown') {
						setFocusedItem((prev) => Math.min(maxItems - 1, prev + 1));
					}
				}
			});
		},
		[setFocusedItem, maxItems],
	);

	return { roomFilesRef, focusedItem, setFocusedItem };
};
