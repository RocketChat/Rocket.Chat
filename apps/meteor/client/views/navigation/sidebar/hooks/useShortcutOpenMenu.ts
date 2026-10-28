import type { RefCallback } from 'react';
import { useCallback } from 'react';
import tinykeys from 'tinykeys';

// used to open the menu option by keyboard
export const useShortcutOpenMenu = (): RefCallback<HTMLElement> =>
	useCallback(
		(node: HTMLElement) =>
			tinykeys(node, {
				Alt: (event) => {
					if (!(event.target instanceof HTMLElement) || !event.target.classList.contains('rcx-item__link')) {
						return;
					}
					event.preventDefault();
					event.target.closest('.rcx-item')?.querySelector<HTMLButtonElement>('.rcx-item__actions--reveal-hover button')?.click();
				},
			}),
		[],
	);
