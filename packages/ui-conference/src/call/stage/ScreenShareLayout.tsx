import { Box } from '@rocket.chat/fuselage';

import ScreenShareThumb from './ScreenShareThumb';
import ScreenViewer from './ScreenViewer';
import { spotlightClasses } from './stageStyles';
import CallTile from '../CallTile';
import type { ScreenShare } from '../lib/screenShares';
import type { SpotlightOrientation, StageTile } from '../lib/stageTiles';

export type ScreenShareLayoutProps = {
	featured: ScreenShare;
	others: ScreenShare[];
	tiles: StageTile[];
	orientation: SpotlightOrientation;
	onPin: (id: string) => void;
	onStopLocalScreenShare?: () => void;
};

/** A shared screen on the stage, with the other shares and everyone's tile beside or under it. */
const ScreenShareLayout = ({ featured, others, tiles, orientation, onPin, onStopLocalScreenShare }: ScreenShareLayoutProps) => {
	const classes = spotlightClasses(orientation);
	return (
		<Box className={classes.container}>
			<ScreenViewer
				stream={featured.stream}
				label={featured.label}
				isLocal={featured.isLocal}
				onStop={featured.isLocal ? onStopLocalScreenShare : undefined}
			/>
			<Box className={classes.thumbs} data-thumb-orientation={classes.thumbOrientation}>
				{others.map((s) => (
					<ScreenShareThumb key={`screen-${s.id}`} stream={s.stream} label={s.label} isLocal={s.isLocal} onSpotlight={() => onPin(s.id)} />
				))}
				{tiles.map((t) => (
					<Box key={t.id} className={classes.thumb}>
						<CallTile {...t} compact />
					</Box>
				))}
			</Box>
		</Box>
	);
};

export default ScreenShareLayout;
