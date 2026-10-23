import type { RefCallback } from 'react';
import { useCallback, useState } from 'react';

export const useIsOverflowing = <T extends HTMLElement>(): [ref: RefCallback<T>, isOverflowing: boolean] => {
	const [isOverflowing, setIsOverflowing] = useState(false);

	const ref = useCallback((node: T) => {
		const observer = new ResizeObserver(() => setIsOverflowing(node.scrollHeight > node.clientHeight));
		observer.observe(node);

		return () => observer.disconnect();
	}, []);

	return [ref, isOverflowing];
};
