import { memo } from 'react';

import TileFrame from './TileFrame';
import TilePicture from './TilePicture';
import { TILE_RING_WIDTH } from '../lib/speakingRing';
import type { TileParticipant } from '../lib/stageTiles';

export type ParticipantTileProps = TileParticipant;

/** Someone else in the call, at the size of a grid cell or the stage. */
const ParticipantTile = ({ displayName, avatarUrl, muted, held, cameraStream, audioStream }: ParticipantTileProps) => (
	<TileFrame displayName={displayName} muted={muted} held={held} audioStream={audioStream} ringWidth={TILE_RING_WIDTH}>
		<TilePicture displayName={displayName} avatarUrl={avatarUrl} cameraStream={cameraStream} avatarSize='x48' mirrored={false} />
	</TileFrame>
);

export default memo(ParticipantTile);
