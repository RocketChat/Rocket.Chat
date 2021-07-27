import { useEffect } from 'react';
import tinykeys from 'tinykeys';

// used to open the menu option by keyboard
export const useShortcutOpenMenu = (ref) => {
	useEffect(() => {
		const unsubscribe = tinykeys(ref.current, {
			Alt: (event) => {
				if (!event.target.className.includes('rcx-sidebar-item')) {
					return;
				}
				event.preventDefault();
				event.target.querySelector('button')?.click();
			},
		});
		return () => {
			unsubscribe();
		};
	}, [ref]);
};
