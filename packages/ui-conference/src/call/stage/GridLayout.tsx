import { Box } from '@rocket.chat/fuselage';
import { useCallback, useMemo, useRef, useState } from 'react';

import OverflowTile from './OverflowTile';
import { gridMeasureStyles, gridStyles } from './stageStyles';
import CallTile from '../CallTile';
import { useTileFlip } from '../hooks/useTileFlip';
import { useTileGridLayout } from '../hooks/useTileGridLayout';
import type { StageTile } from '../lib/stageTiles';
import { MAX_VISIBLE_TILES, absorbLonelyTile, gridCellKeys, gridColumnStartFor, splitByPriority } from '../lib/stageTiles';
import { gridBox } from '../lib/tileGrid';

export type GridLayoutProps = {
	tiles: StageTile[];
	activeSpeakerId: string | null;
	selfId: string;
};

/** Everyone in equal tiles, as many as fit, and one saying how many more there are. */
const GridLayout = ({ tiles, activeSpeakerId, selfId }: GridLayoutProps) => {
	const split = useMemo(() => splitByPriority(tiles, MAX_VISIBLE_TILES, activeSpeakerId, selfId), [tiles, activeSpeakerId, selfId]);

	const [measureEl, setMeasureEl] = useState<HTMLDivElement | null>(null);
	const measureRef = useCallback((node: HTMLDivElement | null) => setMeasureEl(node), []);
	const layout = useTileGridLayout(measureEl, split.visible.length + (split.hidden.length > 0 ? 1 : 0));
	const { cols, rows, cellWidth, cellHeight } = layout;

	const { visible, hidden } = absorbLonelyTile(split.visible, split.hidden, cols);
	const cellCount = visible.length + (hidden.length > 0 ? 1 : 0);

	const gridRef = useRef<HTMLDivElement | null>(null);
	useTileFlip(gridRef, gridCellKeys(visible, hidden), cols);

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
				{visible.map((t, i) => (
					<Box key={t.id} style={{ gridColumnStart: gridColumnStartFor(i, cellCount, cols) }} minWidth={0} minHeight={0}>
						<CallTile {...t} />
					</Box>
				))}
				{hidden.length > 0 && (
					<Box key='overflow' style={{ gridColumnStart: gridColumnStartFor(visible.length, cellCount, cols) }} minWidth={0} minHeight={0}>
						<OverflowTile hidden={hidden} />
					</Box>
				)}
			</Box>
		</Box>
	);
};

export default GridLayout;
