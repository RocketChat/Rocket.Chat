import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

const previewStyles = css`
	position: relative;
	aspect-ratio: 16 / 9;
	container-type: inline-size;
	overflow: hidden;
	border-radius: 0.5rem;
	background-color: black;
	display: flex;
	align-items: center;
	justify-content: center;
`;

type AppearancePreviewProps = { children: ReactNode };

const AppearancePreview = ({ children }: AppearancePreviewProps) => <Box className={previewStyles}>{children}</Box>;

export default AppearancePreview;
