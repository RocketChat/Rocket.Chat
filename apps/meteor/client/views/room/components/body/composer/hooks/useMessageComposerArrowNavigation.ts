/**
 * Just a simple hook to handle arrow navigation in the composer
 */

import { KeyboardEventHandler, useCallback } from 'react';

import { useChat } from '../../../../contexts/ChatContext';

export const useMessageComposerArrowNavigation = ({
	onEscape,
	onArrowUp,
	onArrowDown,
}: {
	onEscape?: () => void;
	onArrowUp?: () => void;
	onArrowDown?: () => void;
}): KeyboardEventHandler<HTMLTextAreaElement> => {
	const chatContext = useChat();

	return useCallback(
		(event) => {
			const { currentTarget: input } = event;

			if (event.shiftKey || event.ctrlKey || event.metaKey) {
				return;
			}

			switch (event.key) {
				case 'Escape': {
					const currentEditing = chatContext?.currentEditing;

					if (currentEditing) {
						event.preventDefault();
						event.stopPropagation();

						currentEditing.reset().then((reset) => {
							if (!reset) {
								currentEditing?.cancel();
							}
						});

						return;
					}

					if (!input.value.trim()) onEscape?.();
					return;
				}

				case 'ArrowUp': {
					if (input.selectionEnd === 0) {
						event.preventDefault();
						event.stopPropagation();

						onArrowUp?.();

						if (event.altKey) {
							input.setSelectionRange(0, 0);
						}
					}

					return;
				}

				case 'ArrowDown': {
					if (input.selectionEnd === input.value.length) {
						event.preventDefault();
						event.stopPropagation();

						onArrowDown?.();

						if (event.altKey) {
							input.setSelectionRange(input.value.length, input.value.length);
						}
					}
				}
			}
		},
		[chatContext?.currentEditing, onArrowDown, onArrowUp, onEscape],
	);
};
