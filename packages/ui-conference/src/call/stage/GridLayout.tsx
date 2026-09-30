import { Box } from '@rocket.chat/fuselage';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import MainTile from './MainTile';
import OverflowTile from './OverflowTile';
import ScreenViewer from './ScreenViewer';
import { gridMeasureStyles, gridStyles } from './stageStyles';
import { useTileGridLayout } from '../hooks/useTileGridLayout';
import type { ScreenShare } from '../lib/screenShares';
import type { StageTile } from '../lib/stageTiles';
import { MAX_VISIBLE_TILES, absorbLonelyTile, gridColumnStartFor, splitByPriority } from '../lib/stageTiles';
import { gridBox } from '../lib/tileGrid';

export type GridLayoutProps = {
	screens: ScreenShare[];
	tiles: StageTile[];
	selfId: string;
};

/** The shared screens, then everyone in equal tiles, as many as fit, and one saying how many more there are. */
const GridLayout = ({ screens, tiles, selfId }: GridLayoutProps) => {
	const { t } = useTranslation();

	// A screen always gets a cell: it is what its sharer wants everyone to see.
	const split = useMemo(
		() => splitByPriority(tiles, Math.max(1, MAX_VISIBLE_TILES - screens.length), selfId),
		[tiles, screens.length, selfId],
	);

	const [measureRef, layoutFor] = useTileGridLayout();
	const { cols: measuredCols } = layoutFor(screens.length + split.visible.length + (split.hidden.length > 0 ? 1 : 0));

	const { visible, hidden } = absorbLonelyTile(split.visible, split.hidden, measuredCols, selfId, screens.length);
	const cellCount = screens.length + visible.length + (hidden.length > 0 ? 1 : 0);

	// Laid out again for the cells actually drawn, in the same columns: an absorbed tile takes its row with it.
	const layout = layoutFor(cellCount, measuredCols);
	const { cols, rows, cellWidth, cellHeight } = layout;

	const { width, height } = gridBox(layout);

	return (
		<Box ref={measureRef} className={gridMeasureStyles}>
			<Box
				className={gridStyles}
				style={{
					width,
					height,
					gridTemplateColumns: `repeat(${cols}, ${cellWidth}px)`,
					gridTemplateRows: `repeat(${rows}, ${cellHeight}px)`,
				}}
			>
				{screens.map((screen, i) => (
					<Box
						key={`screen-${screen.id}`}
						display='flex'
						style={{ gridColumnStart: gridColumnStartFor(i, cellCount, cols) }}
						minWidth={0}
						minHeight={0}
					>
						<ScreenViewer
							stream={screen.stream}
							label={screen.isLocal || !screen.name ? t('Your_screen') : t('__name__screen', { name: screen.name })}
						/>
					</Box>
				))}
				{visible.map((tile, i) => (
					<Box
						key={tile.id}
						style={{ gridColumnStart: gridColumnStartFor(screens.length + i, cellCount, cols) }}
						minWidth={0}
						minHeight={0}
					>
						<MainTile tile={tile} />
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
