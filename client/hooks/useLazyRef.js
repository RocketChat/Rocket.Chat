import { useRef, useState } from 'react';

export const useLazyRef = (fn) => {
	const [value] = useState(fn);
	return useRef(value);
};
