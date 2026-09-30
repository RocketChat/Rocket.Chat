/**
 * Picks the (rows, cols) grid for N call tiles in a container of a given size, keeping each tile's aspect ratio in a
 * band between mildly portrait and widescreen, where a video tile does not read as squashed. Each column count is
 * scored on how close its tile aspect is to 16:9 — gently inside the band, steeply outside it — plus a small bonus
 * for leaving no cell empty.
 */
const TARGET_ASPECT = 16 / 9;
// Mildly portrait: taller than 4:3 sideways looks broken for a video tile.
const MIN_ACCEPTABLE_ASPECT = 3 / 4;
const MAX_ACCEPTABLE_ASPECT = 16 / 9;

export const TILE_GAP_PX = 8;

const scoreAspect = (aspect: number): number => {
	if (aspect >= MIN_ACCEPTABLE_ASPECT && aspect <= MAX_ACCEPTABLE_ASPECT) {
		return -Math.abs(Math.log(aspect / TARGET_ASPECT)) * 0.5;
	}
	if (aspect < MIN_ACCEPTABLE_ASPECT) {
		return -Math.abs(Math.log(MIN_ACCEPTABLE_ASPECT / aspect)) * 2.0;
	}
	return -Math.abs(Math.log(aspect / MAX_ACCEPTABLE_ASPECT)) * 2.0;
};

export const pickTileGridLayout = (count: number, width: number, height: number): { rows: number; cols: number } => {
	if (count <= 1 || width <= 0 || height <= 0) return { rows: 1, cols: Math.max(1, count) };

	let best = { rows: 1, cols: count };
	let bestScore = -Infinity;

	for (let cols = 1; cols <= count; cols++) {
		const rows = Math.ceil(count / cols);
		const aspect = width / cols / (height / rows);
		// Only a tie-breaker: never enough to override the aspect.
		const fillFraction = count / (rows * cols);
		const score = scoreAspect(aspect) + fillFraction * 0.5;

		if (score > bestScore) {
			bestScore = score;
			best = { rows, cols };
		}
	}

	return best;
};

export const clampCellToAspectBand = (cellW: number, cellH: number): { width: number; height: number } => {
	if (cellW <= 0 || cellH <= 0) return { width: cellW, height: cellH };
	const aspect = cellW / cellH;
	if (aspect > MAX_ACCEPTABLE_ASPECT) {
		return { width: cellH * MAX_ACCEPTABLE_ASPECT, height: cellH };
	}
	if (aspect < MIN_ACCEPTABLE_ASPECT) {
		return { width: cellW, height: cellW / MIN_ACCEPTABLE_ASPECT };
	}
	return { width: cellW, height: cellH };
};

export type TileGridLayout = {
	rows: number;
	cols: number;
	/**
	 * Each cell's size in pixels, clamped into the aspect band. Where clamping applies the grid comes out smaller
	 * than the container, and the caller centres it.
	 */
	cellWidth: number;
	cellHeight: number;
};

/**
 * The grid for `count` tiles in a container of the given size, gutters included. `cols` keeps the columns of a
 * layout already picked, for a count that changed because of them.
 */
export const tileGridLayout = (
	count: number,
	width: number,
	height: number,
	cols = pickTileGridLayout(count, width, height).cols,
): TileGridLayout => {
	const rows = Math.max(1, Math.ceil(count / cols));
	// Clamped: before the first measurement the gutters alone outgrow a 0×0 container.
	const naturalCellW = cols > 0 ? Math.max(0, (width - (cols - 1) * TILE_GAP_PX) / cols) : 0;
	const naturalCellH = Math.max(0, (height - (rows - 1) * TILE_GAP_PX) / rows);
	const { width: cellWidth, height: cellHeight } = clampCellToAspectBand(naturalCellW, naturalCellH);
	return { rows, cols, cellWidth, cellHeight };
};

/** The grid's outer size for its cells, or undefined until they have been measured. */
export const gridBox = ({
	cols,
	rows,
	cellWidth,
	cellHeight,
}: TileGridLayout): { width: number | undefined; height: number | undefined } => ({
	width: cols > 0 && cellWidth > 0 ? cols * cellWidth + (cols - 1) * TILE_GAP_PX : undefined,
	height: rows > 0 && cellHeight > 0 ? rows * cellHeight + (rows - 1) * TILE_GAP_PX : undefined,
});
