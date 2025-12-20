import type { KeyboardEvent } from 'react';
import { useCallback } from 'react';
import { useFocusManager } from 'react-aria';
import type { OverlayTriggerState } from 'react-stately';

export const isOption = (node: Element) => node.getAttribute('role') === 'option';

export const useListboxNavigation = (state: OverlayTriggerState) => {
	const focusManager = useFocusManager();

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			if (e.code === 'Tab') {
				state.close();
			}

			if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
				e.preventDefault();

				if (e.code === 'ArrowUp') {
					return focusManager?.focusPrevious({
						wrap: true,
						accept: (node) => isOption(node),
					});
				}

				if (e.code === 'ArrowDown') {
					focusManager?.focusNext({
						wrap: true,
						accept: (node) => isOption(node),
					});
				}
			}
		},
		[focusManager, state],
	);

	return handleKeyDown;
};

export const useSearchInputNavigation = (state: OverlayTriggerState) => {
	const focusManager = useFocusManager();

	const handleKeyDown = useCallback(
		(e: KeyboardEvent) => {
			state.setOpen(true);

			if ((e.code === 'Tab' && e.shiftKey) || e.key === 'Escape') {
				state.close();
			}

			if (e.code === 'ArrowUp' || e.code === 'ArrowDown') {
				e.preventDefault();

				focusManager?.focusNext({
					accept: (node) => isOption(node),
				});
			}
		},
		[focusManager, state],
	);

	return handleKeyDown;
};
