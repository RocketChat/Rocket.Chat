import { useRef, useEffect } from 'react';

export function useOutsideClick(cb) {
	const ref = useRef();
	useEffect(() => {
		function handleClickOutside(event) {
			if (ref.current && !ref.current.contains(event.target)) {
				cb(event);
			}
		}

		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [cb]);

	return ref;
}
