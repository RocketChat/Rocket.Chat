import { memo } from 'react';

import TileFrame from './TileFrame';
import TilePicture from './TilePicture';
import type { TileParticipant } from '../lib/stageTiles';

export type ParticipantThumbnailProps = TileParticipant;

/** Someone else in the call, in a strip or column of thumbnails. */
const ParticipantThumbnail = ({ displayName, avatarUrl, muted, held, cameraStream }: ParticipantThumbnailProps) => (
	<TileFrame displayName={displayName} muted={muted} held={held}>
		<TilePicture displayName={displayName} avatarUrl={avatarUrl} cameraStream={cameraStream} avatarSize='x32' mirrored={false} />
	</TileFrame>
);

export default memo(ParticipantThumbnail);
