import { Box } from '@rocket.chat/fuselage';
import { useMemo, useRef } from 'react';

import GridCell from './GridCell.js';
import MainTile from './MainTile.js';
import OverflowTile from './OverflowTile.js';
import ScreenShareThumb from './ScreenShareThumb.js';
import { gridMeasureStyles, gridStyles } from './stageStyles.js';
import { useTileFlip } from '../hooks/useTileFlip.js';
import { useTileGridLayout } from '../hooks/useTileGridLayout.js';
import type { ScreenShare } from '../lib/screenShares.js';
import type { StageTile } from '../lib/stageTiles.js';
import { MAX_VISIBLE_TILES, absorbLonelyTile, gridCellKeys, gridColumnStartFor, splitByPriority } from '../lib/stageTiles.js';
import { gridBox } from '../lib/tileGrid.js';

export type GridLayoutProps = {
	tiles: StageTile[];
	activeSpeakerId: string | null;
	selfId: string;
	/** Live shares that are not on the stage. */
	screens?: ScreenShare[];
};

/** Everyone in equal tiles, as many as fit, and one saying how many more there are. */
const GridLayout = ({ tiles, activeSpeakerId, selfId, screens = [] }: GridLayoutProps) => {
	const split = useMemo(
		() => splitByPriority(tiles, Math.max(1, MAX_VISIBLE_TILES - screens.length), activeSpeakerId, selfId),
		[tiles, screens.length, activeSpeakerId, selfId],
	);

	const [measureRef, layoutFor] = useTileGridLayout();
	const { cols: measuredCols } = layoutFor(screens.length + split.visible.length + (split.hidden.length > 0 ? 1 : 0));

	const { visible, hidden } = absorbLonelyTile(split.visible, split.hidden, measuredCols, activeSpeakerId, selfId, screens.length);
	const cellCount = screens.length + visible.length + (hidden.length > 0 ? 1 : 0);

	// Laid out again for the cells actually drawn, in the same columns: an absorbed tile takes its row with it.
	const layout = layoutFor(cellCount, measuredCols);
	const { cols, rows, cellWidth, cellHeight } = layout;

	const gridRef = useRef<HTMLDivElement | null>(null);
	useTileFlip(gridRef, [...screens.map(({ id }) => `screen-${id}`), ...gridCellKeys(visible, hidden)], cols);

	const { width, height } = gridBox(layout);

	return (
		<Box ref={measureRef} className={gridMeasureStyles}>
			<Box
				ref={gridRef}
				className={gridStyles}
				style={{
					width,
					height,
					gridTemplateColumns: `repeat(${cols}, ${cellWidth}px)`,
					gridTemplateRows: `repeat(${rows}, ${cellHeight}px)`,
				}}
			>
				{screens.map((screen, i) => (
					<GridCell key={`screen-${screen.id}`} columnStart={gridColumnStartFor(i, cellCount, cols)}>
						<ScreenShareThumb share={screen} />
					</GridCell>
				))}
				{visible.map((t, i) => (
					<GridCell key={t.id} columnStart={gridColumnStartFor(screens.length + i, cellCount, cols)}>
						<MainTile tile={t} />
					</GridCell>
				))}
				{hidden.length > 0 && (
					<GridCell key='overflow' columnStart={gridColumnStartFor(screens.length + visible.length, cellCount, cols)}>
						<OverflowTile hidden={hidden} />
					</GridCell>
				)}
			</Box>
		</Box>
	);
};

export default GridLayout;
