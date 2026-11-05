import { memo } from 'react';

import type { TileFrameProps } from './TileFrame.js';
import TileFrame from './TileFrame.js';
import TilePicture from './TilePicture.js';
import { THUMBNAIL_RING_WIDTH } from '../lib/speakingRing.js';
import type { TileParticipant } from '../lib/stageTiles.js';

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
	reaction,
	sendHeight,
}: SelfThumbnailProps) => (
	<TileFrame
		displayName={displayName}
		muted={muted}
		held={held}
		audioStream={audioStream}
		handPosition={handPosition}
		reaction={reaction}
		ringWidth={THUMBNAIL_RING_WIDTH}
		sendHeight={sendHeight}
	>
		<TilePicture displayName={displayName} avatarUrl={avatarUrl} cameraStream={cameraStream} avatarSize='x32' mirrored />
	</TileFrame>
);

export default memo(SelfThumbnail);
