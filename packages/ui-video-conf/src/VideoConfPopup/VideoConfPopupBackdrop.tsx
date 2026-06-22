import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const backdropStyle = css`
	position: fixed;
	top: 0;
	min-width: 276px;
	[dir='ltr'] & {
		right: 0;
	}
	[dir='rtl'] & {
		left: 0;
	}
`;

const VideoConfPopupBackdrop = ({ children }: { children: ReactNode }) => (
	<Box m={40} zIndex={99} className={backdropStyle}>
		{children}
	</Box>
);

export default VideoConfPopupBackdrop;
