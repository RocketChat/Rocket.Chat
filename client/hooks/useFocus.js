import { useEffect, useRef } from 'react';

export const useFocus = (isFocused) => {
	const ref = useRef(null);

	useEffect(() => {
		if (isFocused && ref.current) {
			ref.current.focus();
		}
	}, [isFocused]);

	return ref;
};
