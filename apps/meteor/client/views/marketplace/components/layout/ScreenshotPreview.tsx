import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type ScreenshotPreviewProps = {
	src?: string;
	alt: string;
	onClick: () => void;
	children: ReactNode;
};

const previewImage = css`
	transition: filter 0.2s ease;
	&:hover {
		filter: brightness(90%);
	}
`;

/**
 * The screenshot shown on an app's details, with a caption bar below it, that opens the full-screen viewer.
 */
const ScreenshotPreview = ({ src, alt, onClick, children }: ScreenshotPreviewProps) => (
	<Box
		onClick={onClick}
		display='flex'
		flexDirection='column'
		maxWidth='x640'
		width='100%'
		style={{
			cursor: 'pointer',
		}}
		tabIndex={0}
	>
		<Box is='img' src={src} alt={alt} className={[previewImage]} />

		<Box display='flex' flexDirection='row' backgroundColor='tint' paddingInline='x16' paddingBlock='x8' alignItems='center' gap='x8'>
			{children}
		</Box>
	</Box>
);

export default ScreenshotPreview;
