import { Box } from '@rocket.chat/fuselage';
import { useMemo, useRef } from 'react';

import MainTile from './MainTile';
import OverflowTile from './OverflowTile';
import ScreenShareThumb from './ScreenShareThumb';
import { gridMeasureStyles, gridStyles } from './stageStyles';
import { useTileFlip } from '../hooks/useTileFlip';
import { useTileGridLayout } from '../hooks/useTileGridLayout';
import type { StageScreen } from '../lib/screenShares';
import type { StageTile } from '../lib/stageTiles';
import { MAX_VISIBLE_TILES, absorbLonelyTile, gridCellKeys, gridColumnStartFor, splitByPriority } from '../lib/stageTiles';
import { gridBox } from '../lib/tileGrid';

export type GridLayoutProps = {
	tiles: StageTile[];
	activeSpeakerId: string | null;
	selfId: string;
	/** Live shares nobody put on the stage, in the first cells. */
	screens?: StageScreen[];
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
					<Box key={`screen-${screen.id}`} style={{ gridColumnStart: gridColumnStartFor(i, cellCount, cols) }} minWidth={0} minHeight={0}>
						<ScreenShareThumb screen={screen} fill />
					</Box>
				))}
				{visible.map((t, i) => (
					<Box key={t.id} style={{ gridColumnStart: gridColumnStartFor(screens.length + i, cellCount, cols) }} minWidth={0} minHeight={0}>
						<MainTile tile={t} />
					</Box>
				))}
				{hidden.length > 0 && (
					<Box
						key='overflow'
						style={{ gridColumnStart: gridColumnStartFor(screens.length + visible.length, cellCount, cols) }}
						minWidth={0}
						minHeight={0}
					>
						<OverflowTile hidden={hidden} />
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default GridLayout;
