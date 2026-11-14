import { Box } from '@rocket.chat/fuselage';
import type { ReactNode } from 'react';

type PermissionsListProps = {
	children: ReactNode;
};

/**
 * The numbered list of the permissions an app asks for.
 */
const PermissionsList = ({ children }: PermissionsListProps) => (
	<Box is='ol' type='1' style={{ listStyleType: 'decimal' }} marginInlineStart='x24'>
		{children}
	</Box>
);

export default PermissionsList;
