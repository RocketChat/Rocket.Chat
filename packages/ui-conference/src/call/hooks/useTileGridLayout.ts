import type { RefCallback } from 'react';
import { useCallback, useState } from 'react';

import type { TileGridLayout } from '../lib/tileGrid';
import { tileGridLayout } from '../lib/tileGrid';

/**
 * The grid for a number of tiles in the element the returned ref is on, kept current as it resizes. A function of
 * the count, so a caller whose cells depend on the columns can lay them out again in the same ones.
 */
export const useTileGridLayout = (): [RefCallback<HTMLElement>, (count: number, cols?: number) => TileGridLayout] => {
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

	const layoutFor = useCallback((count: number, cols?: number) => tileGridLayout(count, size.width, size.height, cols), [size]);

	return [ref, layoutFor];
};
