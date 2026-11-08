import type { RefCallback } from 'react';
import { useCallback, useState } from 'react';

import type { StageSize } from '../lib/stageTiles';

/** The size of whatever element the returned ref is attached to, kept current as it resizes. Zero until measured. */
export const useElementSize = (): [ref: RefCallback<HTMLElement>, size: StageSize] => {
	const [size, setSize] = useState<StageSize>({ width: 0, height: 0 });

	const ref = useCallback((node: HTMLElement) => {
		const update = () => {
			const rect = node.getBoundingClientRect();
			setSize({ width: rect.width, height: rect.height });
		};
		update();
		const observer = new ResizeObserver(update);
		observer.observe(node);
		return () => observer.disconnect();
	}, []);

	return [ref, size];
};
