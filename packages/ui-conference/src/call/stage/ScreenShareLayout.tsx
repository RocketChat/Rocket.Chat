import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import MainTile from './MainTile';
import ScreenShareThumb from './ScreenShareThumb';
import ScreenViewer from './ScreenViewer';
import StopShareButton from './StopShareButton';
import ThumbnailTile from './ThumbnailTile';
import { mainStreamStyles, spotlightClasses } from './stageStyles';
import type { ScreenShare } from '../lib/screenShares';
import type { SpotlightOrientation, StageTile } from '../lib/stageTiles';

export type ScreenShareLayoutProps = {
	featured: ScreenShare;
	others: ScreenShare[];
	tiles: StageTile[];
	orientation: SpotlightOrientation;
	/** The person the reader pinned: large instead of any share, which all go to the head of the thumbnails. */
	pinnedTile?: StageTile;
	onPin: (id: string) => void;
	onStopLocalScreenShare?: () => void;
};

/** A shared screen on the stage, or the pinned person, with the shares and everyone's tile beside or under it. */
const ScreenShareLayout = ({ featured, others, tiles, orientation, pinnedTile, onPin, onStopLocalScreenShare }: ScreenShareLayoutProps) => {
	const { t } = useTranslation();
	const classes = spotlightClasses(orientation);
	const labelOf = ({ name, isLocal }: ScreenShare) => (isLocal || !name ? t('Your_screen') : t('__name__screen', { name }));

	const thumbShares = pinnedTile ? [featured, ...others] : others;
	const thumbTiles = pinnedTile ? tiles.filter(({ id }) => id !== pinnedTile.id) : tiles;

	return (
		<Box className={classes.container}>
			{pinnedTile ? (
				<Box className={mainStreamStyles}>
					<MainTile tile={pinnedTile} />
				</Box>
			) : (
				<ScreenViewer stream={featured.stream} label={labelOf(featured)}>
					{featured.isLocal && onStopLocalScreenShare && <StopShareButton onStop={onStopLocalScreenShare} />}
				</ScreenViewer>
			)}
			<Box className={classes.thumbs} data-thumb-orientation={classes.thumbOrientation}>
				{thumbShares.map((s) => (
					<ScreenShareThumb key={`screen-${s.id}`} stream={s.stream} label={labelOf(s)} onSpotlight={() => onPin(s.id)} />
				))}
				{thumbTiles.map((t) => (
					<Box key={t.id} className={classes.thumb}>
						<ThumbnailTile tile={t} />
					</Box>
				))}
			</Box>
		</Box>
	);
};

export default ScreenShareLayout;
