import { memo } from 'react';

import type { TileFrameProps } from './TileFrame';
import TileFrame from './TileFrame';
import TilePicture from './TilePicture';
import { THUMBNAIL_RING_WIDTH } from '../lib/speakingRing';
import type { TileParticipant } from '../lib/stageTiles';

export type ParticipantThumbnailProps = TileParticipant & Pick<TileFrameProps, 'pin'>;

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
	pin,
}: ParticipantThumbnailProps) => (
	<TileFrame
		displayName={displayName}
		muted={muted}
		held={held}
		audioStream={audioStream}
		handPosition={handPosition}
		reaction={reaction}
		pin={pin}
		ringWidth={THUMBNAIL_RING_WIDTH}
	>
		<TilePicture displayName={displayName} avatarUrl={avatarUrl} cameraStream={cameraStream} avatarSize='x32' mirrored={false} />
	</TileFrame>
);

export default memo(ParticipantThumbnail);
