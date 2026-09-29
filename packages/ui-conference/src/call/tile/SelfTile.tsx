import { memo } from 'react';

import type { TileFrameProps } from './TileFrame';
import TileFrame from './TileFrame';
import TilePicture from './TilePicture';
import type { TileParticipant } from '../lib/stageTiles';

export type SelfTileProps = TileParticipant & Pick<TileFrameProps, 'sendHeight'>;

/** The reader's own view, at the size of a grid cell or the stage: mirrored, and saying what it sends. */
const SelfTile = ({ displayName, avatarUrl, muted, held, cameraStream, sendHeight }: SelfTileProps) => (
	<TileFrame displayName={displayName} muted={muted} held={held} sendHeight={sendHeight}>
		<TilePicture displayName={displayName} avatarUrl={avatarUrl} cameraStream={cameraStream} avatarSize='x48' mirrored />
	</TileFrame>
);

export default memo(SelfTile);
