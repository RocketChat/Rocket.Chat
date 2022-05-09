import { usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import UsersPage from './UsersPage';

function UsersRoute() {
	const canViewUserAdministration = usePermission('view-user-administration');

	if (!canViewUserAdministration) {
		return <NotAuthorizedPage />;
	}

	return <UsersPage />;
}

export default UsersRoute;
