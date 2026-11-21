/* oxlint-disable no-nested-ternary */
import { css } from '@rocket.chat/css-in-js';
import { Avatar, Box, Icon, Throbber } from '@rocket.chat/fuselage';
import { StreamVideo } from '@rocket.chat/ui-media';

import { useStreamHasLiveVideo } from '../hooks/useStreamHasLiveVideo';
import { backdropTint } from '../lib/speakingRing';
import type { TileParticipant } from '../lib/stageTiles';
import TileStatus from './layout/TileStatus';

const avatarBackdropStyles = css`
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
	pointer-events: none;
	filter: blur(15cqw);
`;

const avatarBackdropOverlayStyles = css`
	position: absolute;
	inset: 0;
	pointer-events: none;
`;

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

	if (!cameraActive && status) {
		return (
			<>
				{avatarUrl && (
					<>
						<Box is='img' src={avatarUrl} alt='' className={avatarBackdropStyles} />
						<Box className={avatarBackdropOverlayStyles} style={{ backgroundColor: backdropTint(displayName) }} />
					</>
				)}
				<TileStatus avatar={avatarUrl ? <Avatar url={avatarUrl} size={avatarSize} /> : <Icon name='user' size={avatarSize} />}>
					<Throbber size='x8' inheritColor />
					{status}
				</TileStatus>
			</>
		);
	}

	return cameraActive ? (
		<StreamVideo stream={cameraStream} fit='cover' mirrored={mirrored} style={{ position: 'absolute', inset: 0 }} />
	) : avatarUrl ? (
		<>
			<Box is='img' src={avatarUrl} alt='' className={avatarBackdropStyles} />
			<Box className={avatarBackdropOverlayStyles} style={{ backgroundColor: backdropTint(displayName) }} />
			<Avatar url={avatarUrl} size={avatarSize} />
		</>
	) : (
		<Icon name='user' size={avatarSize} />
	);
};

export default TilePicture;
