import { Avatar, Icon, Throbber } from '@rocket.chat/fuselage';
import { StreamVideo } from '@rocket.chat/ui-media';

import AvatarBackdrop from './AvatarBackdrop';
import TileStatus from './layout/TileStatus';
import { useStreamHasLiveVideo } from '../hooks/useStreamHasLiveVideo';
import type { TileParticipant } from '../lib/stageTiles';

export type TilePictureProps = Pick<TileParticipant, 'displayName' | 'avatarUrl' | 'cameraStream'> & {
	avatarSize: 'x32' | 'x48';
	/** Flipped, as a self-view is, so it reads as a mirror rather than as someone else's camera. */
	mirrored: boolean;
	/** Shown under the avatar while the camera starts. */
	status?: string;
};

/**
 * Their camera while it is producing frames, else their avatar over a blur of itself. A stream alone is not enough:
 * a camera turned off keeps its stream, and would leave the tile black.
 *
 * Always muted: the picture carries only the camera, and the call's audio is played elsewhere.
 */
const TilePicture = ({ displayName, avatarUrl, cameraStream, avatarSize, mirrored, status }: TilePictureProps) => {
	const cameraActive = useStreamHasLiveVideo(cameraStream);

	if (cameraActive) {
		return <StreamVideo stream={cameraStream} fit='cover' mirrored={mirrored} style={{ position: 'absolute', inset: 0 }} />;
	}

	const avatar = avatarUrl ? <Avatar url={avatarUrl} size={avatarSize} /> : <Icon name='user' size={avatarSize} />;

	return (
		<>
			{avatarUrl && <AvatarBackdrop avatarUrl={avatarUrl} displayName={displayName} />}
			{status ? (
				<TileStatus avatar={avatar}>
					<Throbber size='x8' inheritColor />
					{status}
				</TileStatus>
			) : (
				avatar
			)}
		</>
	);
};

export default TilePicture;
