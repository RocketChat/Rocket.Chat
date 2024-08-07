import { Box, ButtonGroup } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';
import React from 'react';

const VoiceCallFooter = ({ children }: { children: ReactNode }) => {
	return (
		<Box is={ButtonGroup} p={12} mbs='auto' bg='surface-light'>
			{children}
		</Box>
	);
};

export default VoiceCallFooter;
