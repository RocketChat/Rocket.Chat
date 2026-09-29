/* eslint-disable no-nested-ternary */
import { css } from '@rocket.chat/css-in-js';
import { Avatar, Box, Icon } from '@rocket.chat/fuselage';
import { usePlayMediaStream } from '@rocket.chat/ui-voip';

import { useStreamHasLiveVideo } from '../hooks/useStreamHasLiveVideo';
import { backdropTint } from '../lib/backdropTint';
import type { TileParticipant } from '../lib/stageTiles';

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
};

/**
 * Their camera while it is producing frames, else their avatar over a blur of itself. A stream alone is not enough:
 * a camera turned off keeps its stream, and would leave the tile black.
 *
 * Always muted: the picture carries only the camera, and the call's audio is played elsewhere.
 */
const TilePicture = ({ displayName, avatarUrl, cameraStream, avatarSize, mirrored }: TilePictureProps) => {
	const [videoRef] = usePlayMediaStream(cameraStream ?? null);
	const cameraActive = useStreamHasLiveVideo(cameraStream);

	return cameraActive ? (
		<video
			ref={videoRef}
			preload='metadata'
			muted
			style={{
				position: 'absolute',
				inset: 0,
				width: '100%',
				height: '100%',
				objectFit: 'cover',
				transform: mirrored ? 'scaleX(-1)' : undefined,
			}}
		>
			<track kind='captions' />
		</video>
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
