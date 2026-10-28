import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type RequesterNameProps = {
	children: ReactNode;
};

/**
 * The name of whoever made a request, in bold at the start of the request's heading.
 */
const RequesterName = ({ children }: RequesterNameProps) => (
	<Box fontScale='p2b' lineHeight='initial' color='titles-labels'>
		{children}
	</Box>
);

export default RequesterName;
