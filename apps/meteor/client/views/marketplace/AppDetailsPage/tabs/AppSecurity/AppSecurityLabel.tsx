import { Box } from '@rocket.chat/fuselage';
import type { ReactElement } from 'react';

const AppSecurityLabel = ({ children }: { children: string }): ReactElement => (
	<Box fontScale='h4' mbe={8} color='titles-labels'>
		{children}
	</Box>
);

export default AppSecurityLabel;
