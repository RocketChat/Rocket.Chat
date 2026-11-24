import { Box } from '@rocket.chat/fuselage';

import ScreenActions from './ScreenActions';
import ScreenShareThumb from './ScreenShareThumb';
import ScreenViewer from './ScreenViewer';
import StopShareButton from './StopShareButton';
import ThumbSlot from './ThumbSlot';
import ThumbnailTile from './ThumbnailTile';
import { spotlightClasses } from './stageStyles';
import ScreenPin from '../ScreenPin';
import { useScreenShareLabel } from '../hooks/useScreenShareLabel';
import type { ScreenShare } from '../lib/screenShares';
import type { SpotlightOrientation, StageTile } from '../lib/stageTiles';

export type ScreenShareLayoutProps = {
	featured: ScreenShare;
	others: ScreenShare[];
	tiles: StageTile[];
	orientation: SpotlightOrientation;
	onStopLocalScreenShare?: () => void;
};

/** A shared screen on the stage, with the other shares and everyone's tile beside or under it. */
const ScreenShareLayout = ({ featured, others, tiles, orientation, onStopLocalScreenShare }: ScreenShareLayoutProps) => {
	const classes = spotlightClasses(orientation);
	const label = useScreenShareLabel(featured);

	return (
		<Box className={classes.container}>
			<ScreenViewer stream={featured.stream} label={label}>
				<ScreenActions>
					<ScreenPin share={featured} />
					{featured.isLocal && onStopLocalScreenShare && <StopShareButton onStop={onStopLocalScreenShare} />}
				</ScreenActions>
			</ScreenViewer>
			<Box className={classes.thumbs}>
				{others.map((share) => (
					<ThumbSlot key={`screen-${share.id}`} orientation={orientation} screen>
						<ScreenShareThumb share={share} />
					</ThumbSlot>
				))}
				{tiles.map((t) => (
					<ThumbSlot key={t.id} orientation={orientation}>
						<ThumbnailTile tile={t} />
					</ThumbSlot>
				))}
			</Box>
		</Box>
	);
};

export default ScreenShareLayout;
