import React from 'react';
import type { ReactNode, ReactElement } from 'react';
import { Modal } from '@rocket.chat/fuselage';

const VideoConfModal = ({ children }: { children: ReactNode }): ReactElement => {
	return (
		<Modal maxWidth='x290'>
			{children}
		</Modal>
	);
};

export default VideoConfModal;
