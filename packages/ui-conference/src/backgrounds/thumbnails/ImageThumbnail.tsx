import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';

const coverStyles = css`
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
`;

const ImageThumbnail = ({ url }: { url: string }) => <Box is='img' src={url} alt='' className={coverStyles} />;

export default ImageThumbnail;
