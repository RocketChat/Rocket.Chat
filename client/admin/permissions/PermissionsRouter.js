import React from 'react';
import { Box } from '@rocket.chat/fuselage';

import { useRouteParameter } from '../../contexts/RouterContext';

const PermissionsRouter = () => {
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	if (context === 'new-role') {
		return <NewRolePage />;
	}

	if (context === 'edit-role') {
		return <EditRolePage />;
	}

	return null;
};

export default PermissionsRouter;
