import type { RefCallback } from 'react';
import { useCallback } from 'react';
import tinykeys from 'tinykeys';

// used to open the menu option by keyboard
export const useShortcutOpenMenu = (): RefCallback<HTMLElement> =>
	useCallback(
		(node: HTMLElement) =>
			tinykeys(node, {
				Alt: (event) => {
					if (!(event.target as HTMLElement).className.includes('rcx-sidebar-item')) {
						return;
					}
					event.preventDefault();
					(event.target as HTMLElement).querySelector('button')?.click();
				},
			}),
		[],
	);
