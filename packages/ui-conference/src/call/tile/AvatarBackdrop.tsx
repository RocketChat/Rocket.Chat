import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';

import { backdropTint } from '../lib/speakingRing';

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

export type AvatarBackdropProps = { avatarUrl: string; displayName: string };

/** The participant's avatar filling the tile behind whatever stands in for their camera. */
const AvatarBackdrop = ({ avatarUrl, displayName }: AvatarBackdropProps) => (
	<>
		<Box is='img' src={avatarUrl} alt='' className={avatarBackdropStyles} />
		<Box className={avatarBackdropOverlayStyles} style={{ backgroundColor: backdropTint(displayName) }} />
	</>
);

export default AvatarBackdrop;
