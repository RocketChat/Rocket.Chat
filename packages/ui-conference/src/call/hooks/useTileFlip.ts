import type { RefObject } from 'react';
import { useLayoutEffect, useRef } from 'react';

import { flipOffset } from '../lib/tileFlip';

/**
 * Animates the grid's cells from where they were to where they are whenever the column count changes, instead of
 * letting them snap. `keys` names the grid's children in render order.
 */
export const useTileFlip = (gridRef: RefObject<HTMLElement | null>, keys: string[], cols: number) => {
	const previousRects = useRef(new Map<string, DOMRect>());
	const previousCols = useRef(cols);

	useLayoutEffect(() => {
		const grid = gridRef.current;
		if (!grid) return;

		const children = Array.from(grid.children) as HTMLElement[];
		const structureChanged = previousCols.current !== cols;
		previousCols.current = cols;

		if (structureChanged && previousRects.current.size > 0) {
			children.forEach((child, i) => {
				const previous = keys[i] ? previousRects.current.get(keys[i]) : undefined;
				const offset = previous && flipOffset(previous, child.getBoundingClientRect());
				if (offset) {
					child.animate([{ transform: `translate(${offset.dx}px, ${offset.dy}px)` }, { transform: 'translate(0, 0)' }], {
						duration: 300,
						easing: 'cubic-bezier(0.2, 0, 0, 1)',
					});
				}
			});
		}

		const next = new Map<string, DOMRect>();
		children.forEach((child, i) => {
			if (keys[i]) next.set(keys[i], child.getBoundingClientRect());
		});
		previousRects.current = next;
	});
};
