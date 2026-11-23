import { memo } from 'react';

import type { TileFrameProps } from './TileFrame.js';
import TileFrame from './TileFrame.js';
import TilePicture from './TilePicture.js';
import { TILE_RING_WIDTH } from '../lib/speakingRing.js';
import type { TileParticipant } from '../lib/stageTiles.js';

export type SelfTileProps = TileParticipant & Pick<TileFrameProps, 'sendHeight'>;

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
}: SelfTileProps) => (
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
		<TilePicture displayName={displayName} avatarUrl={avatarUrl} cameraStream={cameraStream} avatarSize='x48' mirrored />
	</TileFrame>
);

export default memo(SelfTile);
