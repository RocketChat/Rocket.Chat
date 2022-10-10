import { Box } from '@rocket.chat/fuselage';
import styled from '@rocket.chat/styled';
import { forwardRef } from 'react';
import type { ReactNode, ReactElement, HTMLAttributes, Ref } from 'react';

export const VideoConfPopupContainer = styled('div', ({ position: _position, ...props }: { position?: number }) => props)`
	width: 100%;
	position: absolute;
	box-shadow: 0px 4px 32px rgba(0, 0, 0, 0.15);
	top: ${(p): string => (p.position ? `${p.position}px` : '0')};
	left: -${(p): string => (p.position ? `${p.position}px` : '0')};
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
			<Box p='x24' maxWidth='x276' backgroundColor='white'>
				{children}
			</Box>
		</VideoConfPopupContainer>
	);
});

export default VideoConfPopup;
