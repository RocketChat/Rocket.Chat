import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';

const imageStyles = css`
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
`;

type BackgroundTileImageProps = { src: string };

const BackgroundTileImage = ({ src }: BackgroundTileImageProps) => <Box is='img' src={src} alt='' className={imageStyles} />;

export default BackgroundTileImage;
