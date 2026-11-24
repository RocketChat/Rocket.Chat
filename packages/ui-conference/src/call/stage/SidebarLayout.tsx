import { Box } from '@rocket.chat/fuselage';

import MainTile from './MainTile';
import OverflowTile from './OverflowTile';
import ScreenShareThumb from './ScreenShareThumb';
import ThumbSlot from './ThumbSlot';
import ThumbnailTile from './ThumbnailTile';
import { mainStreamStyles, spotlightClasses } from './stageStyles';
import type { ScreenShare } from '../lib/screenShares';
import type { SpotlightOrientation, StageSize, StageTile } from '../lib/stageTiles';
import { sidebarCapacity, splitByPriority } from '../lib/stageTiles';

export type SidebarLayoutProps = {
	featured: StageTile;
	tiles: StageTile[];
	activeSpeakerId: string | null;
	selfId: string;
	stageSize: StageSize;
	orientation: SpotlightOrientation;
	/** Live shares that are not on the stage. */
	screens?: ScreenShare[];
};

/**
 * The speaker large, and as many of everyone else as fit beside or under them without scrolling. Shares are all drawn,
 * so they alone can outgrow the space, and then they scroll.
 */
const SidebarLayout = ({ featured, tiles, activeSpeakerId, selfId, stageSize, orientation, screens = [] }: SidebarLayoutProps) => {
	const classes = spotlightClasses(orientation);
	const { visible, hidden } = splitByPriority(
		tiles.filter((t) => t.id !== featured.id),
		sidebarCapacity(stageSize, orientation, screens.length),
		activeSpeakerId,
		selfId,
	);

	return (
		<Box className={classes.container}>
			<Box className={mainStreamStyles}>
				<MainTile tile={featured} />
			</Box>
			{(screens.length > 0 || visible.length > 0 || hidden.length > 0) && (
				<Box className={classes.thumbs} style={screens.length > 0 ? undefined : { overflow: 'hidden' }}>
					{screens.map((screen) => (
						<ThumbSlot key={`screen-${screen.id}`} orientation={orientation} screen>
							<ScreenShareThumb share={screen} />
						</ThumbSlot>
					))}
					{visible.map((t) => (
						<ThumbSlot key={t.id} orientation={orientation}>
							<ThumbnailTile tile={t} />
						</ThumbSlot>
					))}
					{hidden.length > 0 && (
						<ThumbSlot orientation={orientation}>
							<OverflowTile hidden={hidden} />
						</ThumbSlot>
					)}
				</Box>
			)}
		</Box>
	);
};

export default SidebarLayout;
