import React from 'react';
import type { ReactNode, ReactElement } from 'react';
import styled from '@rocket.chat/styled';
import { Box } from '@rocket.chat/fuselage';

export const VideoConfPopupContainer = styled(
  'div',
  ({ position: _position, ...props }: { position: string }) =>
    props
)`
	width: 100%;
	position: absolute;
	box-shadow: 0px 4px 32px rgb(0 0 0 / 15%);
	top: ${(p) => p.position ? p.position : ''};
	left: -${(p) => p.position ? p.position : ''};
`;

const VideoConfPopup = ({ children, position }: { children: ReactNode; position?: number }): ReactElement => {
	return (
		<VideoConfPopupContainer position={`${position}px`}>
			<Box maxWidth='x276' backgroundColor='white'>{children}</Box>
		</VideoConfPopupContainer>
	);
};

export default VideoConfPopup;
