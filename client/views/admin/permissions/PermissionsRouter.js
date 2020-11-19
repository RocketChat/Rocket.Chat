import React from 'react';

import { useRouteParameter } from '../../../contexts/RouterContext';
import UsersInRole from './UsersInRole';
import PermissionsTable from './PermissionsTable';

const PermissionsRouter = () => {
	const context = useRouteParameter('context');
	if (context === 'users-in-role') {
		return <UsersInRole />;
	}

	return <PermissionsTable />;
};

export default PermissionsRouter;
