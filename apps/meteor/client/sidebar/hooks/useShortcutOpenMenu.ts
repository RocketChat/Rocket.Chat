import type { RefObject } from 'react';
import { useEffect } from 'react';
import tinykeys from 'tinykeys';

// used to open the menu option by keyboard
export const useShortcutOpenMenu = (ref: RefObject<Element>): void => {
	useEffect(() => {
		const unsubscribe = tinykeys(ref.current as HTMLElement, {
			Alt: (event) => {
				if (!(event.target as HTMLElement).className.includes('rcx-sidebar-item')) {
					return;
				}
				event.preventDefault();
				(event.target as HTMLElement).querySelector('button')?.click();
			},
		});
		return (): void => {
			unsubscribe();
		};
	}, [ref]);
};
