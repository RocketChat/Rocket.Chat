import { useCallback, useState } from 'react';
import { useFocusManager } from 'react-aria';

const isListItem = (node: EventTarget) => (node as HTMLElement).getAttribute('role') === 'listitem';

export const useRoomFilesNavigation = () => {
	const roomFilesFocusManager = useFocusManager();

	// const roomFilesRef = useCallback(
	// 	(node: HTMLDivElement | null) => {
	// 		if (!node) {
	// 			return;
	// 		}

	// 		node.addEventListener('keydown', (e) => {
	// 			if (!e.target) {
	// 				return;
	// 			}

	// 			if (!isListItem(e.target)) {
	// 				return;
	// 			}

	// 			if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
	// 				e.preventDefault();
	// 				e.stopPropagation();

	// 				if (e.key === 'ArrowUp') {
	// 					roomFilesFocusManager?.focusPrevious({ accept: (node) => isListItem(node) });
	// 				}

	// 				if (e.key === 'ArrowDown') {
	// 					roomFilesFocusManager?.focusNext({ accept: (node) => isListItem(node) });
	// 				}
	// 			}
	// 		});
	// 	},
	// 	[roomFilesFocusManager],
	// );

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
					console.log('arrow up or down');
					e.preventDefault();
					e.stopPropagation();

					if (e.key === 'ArrowUp') {
						// roomFilesFocusManager?.focusPrevious({ accept: (node) => isListItem(node) });
						setFocusedItem((prev) => (prev > 0 ? prev - 1 : prev));
					}

					if (e.key === 'ArrowDown') {
						// roomFilesFocusManager?.focusNext({ accept: (node) => isListItem(node) });
						setFocusedItem((prev) => prev + 1);
					}
				}
			});
		},
		[roomFilesFocusManager, setFocusedItem],
	);

	return {roomFilesRef, focusedItem, setFocusedItem};
};
