import { Box } from '@rocket.chat/fuselage';
import { useTranslation } from 'react-i18next';

import ScreenShareThumb from './ScreenShareThumb.js';
import ScreenViewer from './ScreenViewer.js';
import StopShareButton from './StopShareButton.js';
import ThumbnailTile from './ThumbnailTile.js';
import { spotlightClasses } from './stageStyles.js';
import type { ScreenShare } from '../lib/screenShares.js';
import type { SpotlightOrientation, StageTile } from '../lib/stageTiles.js';

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
	const { t } = useTranslation();
	const classes = spotlightClasses(orientation);
	const labelOf = ({ name, isLocal }: ScreenShare) => (isLocal || !name ? t('Your_screen') : t('__name__screen', { name }));

	return (
		<Box className={classes.container}>
			<ScreenViewer stream={featured.stream} label={labelOf(featured)}>
				{featured.isLocal && onStopLocalScreenShare && <StopShareButton onStop={onStopLocalScreenShare} />}
			</ScreenViewer>
			<Box className={classes.thumbs} data-thumb-orientation={classes.thumbOrientation}>
				{others.map((s) => (
					<ScreenShareThumb key={`screen-${s.id}`} stream={s.stream} label={labelOf(s)} onSpotlight={() => onPin(s.id)} />
				))}
				{tiles.map((t) => (
					<Box key={t.id} className={classes.thumb}>
						<ThumbnailTile tile={t} />
					</Box>
				))}
			</Box>
		</Box>
	);
};

export default ScreenShareLayout;
