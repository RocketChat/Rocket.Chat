import { useEffect, useState } from 'react';

/**
 * Picks the best (rows, cols) grid for laying out N call tiles inside a
 * container of given pixel dimensions, so that the resulting tile aspect
 * ratio stays within an acceptable band.
 *
 * Why this exists: CSS `repeat(auto-fit, minmax(W, 1fr))` is great for
 * homogeneous content but produces extremely wide-short tiles when the
 * viewport is short, and extremely tall-narrow tiles when the viewport
 * is narrow. Video conferencing tiles look natural between square (1:1)
 * and widescreen (16:9); anything outside that range reads as squashed.
 *
 * Algorithm:
 *   For each candidate `cols` in 1..N:
 *     rows = ceil(N / cols)
 *     tile aspect = (W/cols) / (H/rows)
 *   Score = aspect-fit + fill-fraction.
 *
 * Inside the [1.0 .. 16:9] band the aspect penalty is gentle; outside it
 * grows quickly (×4 weight), so the algorithm strongly prefers staying
 * within the band even at the cost of a few empty cells.
 */
const TARGET_ASPECT = 16 / 9;
// Lower bound is mildly portrait (4:3 sideways). Going lower (taller than 4:3
// for a video tile) looks broken; keep it loose enough that "slightly taller
// than square" is still considered in-band.
const MIN_ACCEPTABLE_ASPECT = 3 / 4;
const MAX_ACCEPTABLE_ASPECT = 16 / 9; // widescreen
const TILE_GAP_PX = 8;

const scoreAspect = (aspect: number): number => {
	if (aspect >= MIN_ACCEPTABLE_ASPECT && aspect <= MAX_ACCEPTABLE_ASPECT) {
		// Inside the sweet spot — small reward for being close to the target.
		return -Math.abs(Math.log(aspect / TARGET_ASPECT)) * 0.5;
	}
	if (aspect < MIN_ACCEPTABLE_ASPECT) {
		// Too tall / narrow.
		return -Math.abs(Math.log(MIN_ACCEPTABLE_ASPECT / aspect)) * 2.0;
	}
	// Too wide / short.
	return -Math.abs(Math.log(aspect / MAX_ACCEPTABLE_ASPECT)) * 2.0;
};

export const pickTileGridLayout = (count: number, width: number, height: number): { rows: number; cols: number } => {
	if (count <= 1 || width <= 0 || height <= 0) return { rows: 1, cols: Math.max(1, count) };

	let best = { rows: 1, cols: count };
	let bestScore = -Infinity;

	for (let cols = 1; cols <= count; cols++) {
		const rows = Math.ceil(count / cols);
		const tileW = width / cols;
		const tileH = height / rows;
		const aspect = tileW / tileH;

		// fill fraction: 1.0 when rows*cols == count, lower when there are
		// empty cells. We mildly prefer "no empty cells" — not enough to
		// override aspect, but a tie-breaker when two layouts score the same.
		const fillFraction = count / (rows * cols);
		const score = scoreAspect(aspect) + fillFraction * 0.5;

		if (score > bestScore) {
			bestScore = score;
			best = { rows, cols };
		}
	}

	return best;
};

export type TileGridLayout = {
	rows: number;
	cols: number;
	/**
	 * Per-tile pixel dimensions to apply on the grid via inline styles.
	 * When the natural cell aspect would fall outside the acceptable band
	 * these are clamped to keep tiles within `[3:4 .. 16:9]`, and the
	 * resulting grid is smaller than the container — the consumer should
	 * center it inside the available area.
	 */
	cellWidth: number;
	cellHeight: number;
};

const clampCellToAspectBand = (cellW: number, cellH: number): { width: number; height: number } => {
	if (cellW <= 0 || cellH <= 0) return { width: cellW, height: cellH };
	const aspect = cellW / cellH;
	if (aspect > MAX_ACCEPTABLE_ASPECT) {
		// Too wide — clamp width down to the max-aspect equivalent of the height.
		return { width: cellH * MAX_ACCEPTABLE_ASPECT, height: cellH };
	}
	if (aspect < MIN_ACCEPTABLE_ASPECT) {
		// Too tall — clamp height down to the min-aspect equivalent of the width.
		return { width: cellW, height: cellW / MIN_ACCEPTABLE_ASPECT };
	}
	return { width: cellW, height: cellH };
};

/**
 * React hook: observes the container's size, picks the best grid layout for
 * the given tile count, and returns both the (rows, cols) and the per-tile
 * pixel dimensions (clamped to the acceptable aspect band).
 *
 * Accepts the DOM element directly (not a ref) so that a callback-ref in the
 * caller triggers a re-observe whenever the element mounts or remounts — e.g.
 * when switching from spotlight back to grid.
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

	const { rows, cols } = pickTileGridLayout(count, size.width, size.height);
	// Subtract gutters before computing the per-cell box.
	const naturalCellW = cols > 0 ? (size.width - (cols - 1) * TILE_GAP_PX) / cols : 0;
	const naturalCellH = rows > 0 ? (size.height - (rows - 1) * TILE_GAP_PX) / rows : 0;
	const { width: cellWidth, height: cellHeight } = clampCellToAspectBand(naturalCellW, naturalCellH);
	return { rows, cols, cellWidth, cellHeight };
};
