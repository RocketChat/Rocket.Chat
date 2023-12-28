import { Box, Palette } from '@rocket.chat/fuselage';
import styled from '@rocket.chat/styled';
import { forwardRef } from 'react';
import type { ReactNode, ReactElement, HTMLAttributes, Ref } from 'react';

export const VideoConfPopupContainer = styled('div', ({ position: _position, ...props }: { position?: number }) => props)`
	width: 100%;
	position: absolute;
	box-shadow: 0px 0px 1px 0px ${Palette.shadow['shadow-elevation-2x'].toString()},
		0px 0px 12px 0px ${Palette.shadow['shadow-elevation-2y'].toString()};
	background-color: ${Palette.surface['surface-light'].toString()};
	border: 1px solid ${Palette.stroke['stroke-extra-light'].toString()};
	top: ${(p): string => (p.position ? `${p.position}px` : '0')};
	left: -${(p): string => (p.position ? `${p.position}px` : '0')};
	border-radius: 0.25rem;
`;

type VideoConfPopupProps = {
	children: ReactNode;
	position?: number;
} & HTMLAttributes<HTMLElement>;

const VideoConfPopup = forwardRef(function VideoConfPopup(
	{ children, position }: VideoConfPopupProps,
	ref: Ref<HTMLDivElement>,
): ReactElement {
	return (
		<VideoConfPopupContainer ref={ref} position={position}>
			<Box p={24} maxWidth='x276' color='default'>
				{children}
			</Box>
		</VideoConfPopupContainer>
	);
});

export default VideoConfPopup;
