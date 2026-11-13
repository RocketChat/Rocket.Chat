import { Box } from '@rocket.chat/fuselage';

import MainTile from './MainTile.js';
import OverflowTile from './OverflowTile.js';
import ThumbnailTile from './ThumbnailTile.js';
import { mainStreamStyles, spotlightClasses } from './stageStyles.js';
import type { SpotlightOrientation, StageSize, StageTile } from '../lib/stageTiles.js';
import { sidebarCapacity, splitByPriority } from '../lib/stageTiles.js';

export type SidebarLayoutProps = {
	featured: StageTile;
	tiles: StageTile[];
	activeSpeakerId: string | null;
	selfId: string;
	stageSize: StageSize;
	orientation: SpotlightOrientation;
};

/** The speaker large, and as many of everyone else as fit beside or under them without scrolling. */
const SidebarLayout = ({ featured, tiles, activeSpeakerId, selfId, stageSize, orientation }: SidebarLayoutProps) => {
	const classes = spotlightClasses(orientation);
	const { visible, hidden } = splitByPriority(
		tiles.filter((t) => t.id !== featured.id),
		sidebarCapacity(stageSize, orientation),
		activeSpeakerId,
		selfId,
	);

	return (
		<Box className={classes.container}>
			<Box className={mainStreamStyles}>
				<MainTile tile={featured} />
			</Box>
			{(visible.length > 0 || hidden.length > 0) && (
				<Box className={classes.thumbs} style={{ overflow: 'hidden' }} data-thumb-orientation={classes.thumbOrientation}>
					{visible.map((t) => (
						<Box key={t.id} className={classes.thumb}>
							<ThumbnailTile tile={t} />
						</Box>
					))}
					{hidden.length > 0 && (
						<Box className={classes.thumb}>
							<OverflowTile hidden={hidden} />
						</Box>
					)}
				</Box>
			)}
		</Box>
	);
};

export default SidebarLayout;
