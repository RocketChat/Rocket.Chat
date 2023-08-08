import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';
import React from 'react';

const AppSecurityLabel = ({ children }: { children: string }): ReactElement => (
	<Box fontScale='h4' mbe={8} color='titles-labels'>
		{children}
	</Box>
);

export default AppSecurityLabel;
