import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import type { TileFrameProps } from './TileFrame';
import TileFrame from './TileFrame';
import TilePicture from './TilePicture';
import { TILE_RING_WIDTH } from '../lib/speakingRing';
import type { TileParticipant } from '../lib/stageTiles';

export type SelfTileProps = TileParticipant & Pick<TileFrameProps, 'sendHeight'> & { cameraStarting?: boolean };

/** The reader's own view, at the size of a grid cell or the stage: mirrored, and saying what it sends. */
const SelfTile = ({
	displayName,
	avatarUrl,
	muted,
	held,
	cameraStream,
	audioStream,
	handPosition,
	reaction,
	sendHeight,
	cameraStarting,
}: SelfTileProps) => {
	const { t } = useTranslation();

	return (
		<TileFrame
			displayName={displayName}
			muted={muted}
			held={held}
			audioStream={audioStream}
			handPosition={handPosition}
			reaction={reaction}
			ringWidth={TILE_RING_WIDTH}
			sendHeight={sendHeight}
		>
			<TilePicture
				displayName={displayName}
				avatarUrl={avatarUrl}
				cameraStream={cameraStream}
				avatarSize='x48'
				mirrored
				status={cameraStarting ? t('Starting_background_effect') : undefined}
			/>
		</TileFrame>
	);
};

export default memo(SelfTile);
