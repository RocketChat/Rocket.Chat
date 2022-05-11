import { Modal } from '@rocket.chat/fuselage';
import type { ReactNode, ReactElement } from 'react';
import React from 'react';

const VideoConfModalContent = ({ children }: { children: ReactNode }): ReactElement => (
	<Modal.Content pbs='x32' display='flex' flexDirection='column' alignItems='center'>
		{children}
	</Modal.Content>
);

export default VideoConfModalContent;
