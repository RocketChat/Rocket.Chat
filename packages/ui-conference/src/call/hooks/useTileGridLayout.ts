import type { RefCallback } from 'react';
import { useCallback, useState } from 'react';

import type { TileGridLayout } from '../lib/tileGrid';
import { tileGridLayout } from '../lib/tileGrid';

/** The grid for `count` tiles in the element the returned ref is on, kept current as it resizes. */
export const useTileGridLayout = (count: number): [RefCallback<HTMLElement>, TileGridLayout] => {
	const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

	const ref = useCallback((node: HTMLElement) => {
		const update = () => {
			const rect = node.getBoundingClientRect();
			setSize({ width: rect.width, height: rect.height });
		};
		update();
		const ro = new ResizeObserver(update);
		ro.observe(node);
		return () => ro.disconnect();
	}, []);

	return [ref, tileGridLayout(count, size.width, size.height)];
};
