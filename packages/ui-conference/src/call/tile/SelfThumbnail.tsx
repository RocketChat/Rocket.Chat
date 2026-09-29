import { memo } from 'react';

import TileFrame from './TileFrame';
import TilePicture from './TilePicture';
import type { TileParticipant } from '../lib/stageTiles';

export type SelfThumbnailProps = TileParticipant;

/** The reader's own view in a strip, a column or the corner of the stage. */
const SelfThumbnail = ({ displayName, avatarUrl, muted, held, cameraStream }: SelfThumbnailProps) => (
	<TileFrame displayName={displayName} muted={muted} held={held}>
		<TilePicture displayName={displayName} avatarUrl={avatarUrl} cameraStream={cameraStream} avatarSize='x32' mirrored />
	</TileFrame>
);

export default memo(SelfThumbnail);
