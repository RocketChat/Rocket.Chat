import type { RefCallback } from 'react';
import { useCallback, useState } from 'react';

/** The height of the element the returned ref is attached to, in pixels, kept current as it changes; 0 while there is none. */
export const useElementHeight = (): [ref: RefCallback<HTMLElement>, height: number] => {
	const [height, setHeight] = useState(0);

	const ref = useCallback((element: HTMLElement) => {
		const measure = () => setHeight(element.offsetHeight);
		measure();

		const observer = new ResizeObserver(measure);
		observer.observe(element);

		return () => {
			observer.disconnect();
			setHeight(0);
		};
	}, []);

	return [ref, height];
};
