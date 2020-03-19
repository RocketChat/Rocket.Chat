import { useEffect, useRef } from 'react';

export const useFocus = (isFocused) => {
	const elementRef = useRef();

	useEffect(() => {
		if (isFocused && elementRef.current) {
			elementRef.current.focus();
		}
	}, [elementRef, isFocused]);

	return elementRef;
};
