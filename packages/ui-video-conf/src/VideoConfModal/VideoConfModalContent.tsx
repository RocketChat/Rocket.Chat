import { Modal, Box } from '@rocket.chat/fuselage';
import type { ReactNode, ReactElement } from 'react';
import React from 'react';

const VideoConfModalContent = ({ children }: { children: ReactNode }): ReactElement => (
	<Modal.Content>
		<Box mbs='x32' display='flex' flexDirection='column' alignItems='center'>
			{children}
		</Box>
	</Modal.Content>
);

export default VideoConfModalContent;
