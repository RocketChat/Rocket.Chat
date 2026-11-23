import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import { StreamVideo } from '@rocket.chat/ui-media';

// Scaled up so the blur does not fade out at the tile's edges.
const blurredStyles = css`
	position: absolute;
	inset: 0;
	filter: blur(4px);
	transform: scale(1.1);
`;

const videoStyles = { position: 'absolute', inset: 0 } as const;

type BackgroundTileBlurredCameraProps = { stream: MediaStream | undefined };

const BackgroundTileBlurredCamera = ({ stream }: BackgroundTileBlurredCameraProps) => (
	<Box is='span' className={blurredStyles}>
		<StreamVideo stream={stream} fit='cover' mirrored style={videoStyles} />
	</Box>
);

export default BackgroundTileBlurredCamera;
