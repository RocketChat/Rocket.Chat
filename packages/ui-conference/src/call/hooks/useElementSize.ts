import { useCallback, useEffect, useState } from 'react';

import type { StageSize } from '../lib/stageTiles';

/** The size of whatever element the returned ref is attached to, kept current as it resizes. Zero until measured. */
export const useElementSize = (): [ref: (node: HTMLElement | null) => void, size: StageSize] => {
	// A callback ref, so an element that mounts after the first render is still observed.
	const [element, setElement] = useState<HTMLElement | null>(null);
	const ref = useCallback((node: HTMLElement | null) => setElement(node), []);
	const [size, setSize] = useState<StageSize>({ width: 0, height: 0 });

	useEffect(() => {
		if (!element) return undefined;
		const update = () => {
			const rect = element.getBoundingClientRect();
			setSize({ width: rect.width, height: rect.height });
		};
		update();
		const observer = new ResizeObserver(update);
		observer.observe(element);
		return () => observer.disconnect();
	}, [element]);

	return [ref, size];
};
