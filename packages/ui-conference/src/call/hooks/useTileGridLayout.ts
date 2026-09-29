import { useEffect, useState } from 'react';

import type { TileGridLayout } from '../lib/tileGrid';
import { tileGridLayout } from '../lib/tileGrid';

/**
 * The grid for `count` tiles in the container, kept current as it resizes.
 *
 * Takes the element rather than a ref, so a callback ref in the caller re-observes whenever the element remounts.
 */
export const useTileGridLayout = (container: HTMLElement | null, count: number): TileGridLayout => {
	const [size, setSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

	useEffect(() => {
		if (!container) {
			setSize({ width: 0, height: 0 });
			return undefined;
		}
		const update = () => {
			const rect = container.getBoundingClientRect();
			setSize({ width: rect.width, height: rect.height });
		};
		update();
		const ro = new ResizeObserver(update);
		ro.observe(container);
		return () => ro.disconnect();
	}, [container]);

	return tileGridLayout(count, size.width, size.height);
};
