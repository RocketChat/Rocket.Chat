import { memo } from 'react';

import TileFrame from './TileFrame.js';
import TilePicture from './TilePicture.js';
import { THUMBNAIL_RING_WIDTH } from '../lib/speakingRing.js';
import type { TileParticipant } from '../lib/stageTiles.js';

export type ParticipantThumbnailProps = TileParticipant;

/** Someone else in the call, in a strip or column of thumbnails. */
const ParticipantThumbnail = ({
	displayName,
	avatarUrl,
	muted,
	held,
	cameraStream,
	audioStream,
	handPosition,
	reaction,
}: ParticipantThumbnailProps) => (
	<TileFrame
		displayName={displayName}
		muted={muted}
		held={held}
		audioStream={audioStream}
		handPosition={handPosition}
		reaction={reaction}
		ringWidth={THUMBNAIL_RING_WIDTH}
	>
		<TilePicture displayName={displayName} avatarUrl={avatarUrl} cameraStream={cameraStream} avatarSize='x32' mirrored={false} />
	</TileFrame>
);

export default memo(ParticipantThumbnail);
