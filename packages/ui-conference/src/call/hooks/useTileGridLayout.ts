import type { RefCallback } from 'react';
import { useCallback } from 'react';

import { useElementSize } from './useElementSize';
import type { TileGridLayout } from '../lib/tileGrid';
import { tileGridLayout } from '../lib/tileGrid';

/**
 * The grid for a number of tiles in the element the returned ref is on, kept current as it resizes. A function of
 * the count, so a caller whose cells depend on the columns can lay them out again in the same ones.
 */
export const useTileGridLayout = (): [RefCallback<HTMLElement>, (count: number, cols?: number) => TileGridLayout] => {
	const [ref, size] = useElementSize();

	const layoutFor = useCallback((count: number, cols?: number) => tileGridLayout(count, size.width, size.height, cols), [size]);

	return [ref, layoutFor];
};
