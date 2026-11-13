import type { ReactNode } from 'react';

import type { BoxProps } from '../Box';
import { Box } from '../Box';

type VideoPlayerButtonProps = Pick<
	BoxProps,
	'size' | 'width' | 'height' | 'marginInline' | 'borderRadius' | 'borderWidth' | 'borderColor' | 'backgroundColor' | 'fontScale'
> & {
	label: string;
	onClick: () => void;
	children: ReactNode;
};

const VideoPlayerButton = ({
	label,
	onClick,
	children,
	size = 'x32',
	width,
	height,
	marginInline,
	borderRadius = 'medium',
	borderWidth,
	borderColor,
	backgroundColor = 'transparent',
	fontScale,
}: VideoPlayerButtonProps) => (
	<Box
		is='button'
		type='button'
		aria-label={label}
		onClick={onClick}
		focusable
		display='inline-flex'
		flexShrink={0}
		alignItems='center'
		justifyContent='center'
		padding={0}
		color='pure-white'
		size={size}
		width={width}
		height={height}
		marginInline={marginInline}
		borderRadius={borderRadius}
		borderWidth={borderWidth}
		borderColor={borderColor}
		backgroundColor={backgroundColor}
		fontScale={fontScale}
	>
		{children}
	</Box>
);

export default VideoPlayerButton;
