import { Box } from '@rocket.chat/fuselage';

import MainTile from './MainTile';
import ScreenShareThumb from './ScreenShareThumb';
import ScreenViewer from './ScreenViewer';
import StopShareButton from './StopShareButton';
import ThumbSlot from './ThumbSlot';
import ThumbnailTile from './ThumbnailTile';
import { mainStreamStyles, screenActionsStyles, spotlightClasses } from './stageStyles';
import PinToggle from '../PinToggle';
import { useScreenShareLabels } from '../hooks/useScreenShareLabels';
import type { StageScreen } from '../lib/screenShares';
import type { SpotlightOrientation, StageTile } from '../lib/stageTiles';

export type ScreenShareLayoutProps = {
	/** What is large: a share, or the person the reader pinned over the shares. */
	main: { screen: StageScreen } | { tile: StageTile };
	/** The shares not on the stage, at the head of the thumbnails. */
	screens: StageScreen[];
	tiles: StageTile[];
	orientation: SpotlightOrientation;
	onStopLocalScreenShare?: () => void;
};

/** A shared screen on the stage, or the pinned person, with the other shares and everyone's tile beside or under it. */
const ScreenShareLayout = ({ main, screens, tiles, orientation, onStopLocalScreenShare }: ScreenShareLayoutProps) => {
	const classes = spotlightClasses(orientation);
	const { labelOf, pinLabelOf } = useScreenShareLabels();

	const largeTileId = 'tile' in main ? main.tile.id : undefined;

	return (
		<Box className={classes.container}>
			{'tile' in main ? (
				<Box className={mainStreamStyles}>
					<MainTile tile={main.tile} />
				</Box>
			) : (
				<ScreenViewer stream={main.screen.stream} label={labelOf(main.screen)}>
					<Box className={screenActionsStyles}>
						<PinToggle
							size='small'
							variant='secondary'
							pinned
							label={pinLabelOf(main.screen, true)}
							restoreFocus={main.screen.pin.restoreFocus}
							onPinToggle={main.screen.pin.onToggle}
						/>
						{main.screen.isLocal && onStopLocalScreenShare && <StopShareButton onStop={onStopLocalScreenShare} />}
					</Box>
				</ScreenViewer>
			)}
			<Box className={classes.thumbs}>
				{screens.map((screen) => (
					<ThumbSlot key={`screen-${screen.id}`} orientation={orientation} screen>
						<ScreenShareThumb screen={screen} />
					</ThumbSlot>
				))}
				{tiles
					.filter(({ id }) => id !== largeTileId)
					.map((t) => (
						<ThumbSlot key={t.id} orientation={orientation}>
							<ThumbnailTile tile={t} />
						</ThumbSlot>
					))}
			</Box>
		</Box>
	);
};

export default ScreenShareLayout;
