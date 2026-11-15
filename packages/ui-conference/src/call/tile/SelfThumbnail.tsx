import { memo } from 'react';

import type { TileFrameProps } from './TileFrame';
import TileFrame from './TileFrame';
import TilePicture from './TilePicture';
import { THUMBNAIL_RING_WIDTH } from '../lib/speakingRing';
import type { TileParticipant } from '../lib/stageTiles';

export type SelfThumbnailProps = TileParticipant & Pick<TileFrameProps, 'sendHeight'>;

/** The reader's own view in a strip, a column or the corner of the stage. */
const SelfThumbnail = ({
	displayName,
	avatarUrl,
	muted,
	held,
	cameraStream,
	audioStream,
	handPosition,
	sendHeight,
}: SelfThumbnailProps) => (
	<TileFrame
		displayName={displayName}
		muted={muted}
		held={held}
		audioStream={audioStream}
		handPosition={handPosition}
		ringWidth={THUMBNAIL_RING_WIDTH}
		sendHeight={sendHeight}
	>
		<TilePicture displayName={displayName} avatarUrl={avatarUrl} cameraStream={cameraStream} avatarSize='x32' mirrored />
	</TileFrame>
);

export default memo(SelfThumbnail);
