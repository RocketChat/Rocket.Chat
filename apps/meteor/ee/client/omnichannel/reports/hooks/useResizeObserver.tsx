/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useRef, useState } from 'react';

export const useResizeObserver = <T extends Element>() => {
	const [isResizing, setResizing] = useState(false);
	const ref = useRef<T>(null);
	const timeoutId = useRef<NodeJS.Timeout | null>(null);
	const lastWidth = useRef<number | null>(null);

	useEffect(() => {
		const { current: element } = ref;
		if (!element) {
			return;
		}

		const resizeObserver = new ResizeObserver(([firstEntry]) => {
			const currentWidth = firstEntry.borderBoxSize[0].inlineSize;

			if (currentWidth === lastWidth.current) {
				return;
			}

			if (timeoutId.current) {
				clearTimeout(timeoutId.current);
			}

			if (!isResizing) {
				setResizing(true);
			}

			lastWidth.current = currentWidth;
			timeoutId.current = setTimeout(() => {
				setResizing(false);
				timeoutId.current = null;
			}, 200);
		});

		resizeObserver.observe(element);

		return () => resizeObserver.unobserve(element);
	}, []);

	return { isResizing, ref };
};
