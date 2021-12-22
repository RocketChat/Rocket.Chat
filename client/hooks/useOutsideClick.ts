import { useEffect, RefObject } from 'react';

// TODO: fuselage

export function useOutsideClick<T extends HTMLElement>(
	ref: RefObject<T>,
	cb: (e: MouseEvent) => void,
): void {
	useEffect(() => {
		function handleClickOutside(event: MouseEvent): void {
			if (event && ref.current && !ref.current.contains(event.target as Node)) {
				return cb(event);
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		return (): void => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [cb, ref]);
}
