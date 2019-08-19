import { useEffect, useState } from 'react';

export const useFocus = (isFocused) => {
	const [element, setElement] = useState(null);

	useEffect(() => {
		if (isFocused && element) {
			element.focus();
		}
	}, [element, isFocused]);

	return (ref) => {
		setElement(ref);
	};
};
