import { memo } from 'react';

import type { TileFrameProps } from './TileFrame.js';
import TileFrame from './TileFrame.js';
import TilePicture from './TilePicture.js';
import { TILE_RING_WIDTH } from '../lib/speakingRing.js';
import type { TileParticipant } from '../lib/stageTiles.js';

export type ParticipantTileProps = TileParticipant & Pick<TileFrameProps, 'participantId'>;

/** Someone else in the call, at the size of a grid cell or the stage. */
const ParticipantTile = ({
	displayName,
	avatarUrl,
	muted,
	held,
	cameraStream,
	audioStream,
	handPosition,
	reaction,
	participantId,
}: ParticipantTileProps) => (
	<TileFrame
		displayName={displayName}
		muted={muted}
		held={held}
		audioStream={audioStream}
		handPosition={handPosition}
		reaction={reaction}
		participantId={participantId}
		ringWidth={TILE_RING_WIDTH}
	>
		<TilePicture displayName={displayName} avatarUrl={avatarUrl} cameraStream={cameraStream} avatarSize='x48' mirrored={false} />
	</TileFrame>
);

export default memo(ParticipantTile);
