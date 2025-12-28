import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import AdminUsersPage from './AdminUsersPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const AdminUsersRoute = (): ReactElement => {
	const canViewUserAdministration = usePermission('view-user-administration');

	if (!canViewUserAdministration) {
		return <NotAuthorizedPage />;
	}

	return <AdminUsersPage />;
};

export default AdminUsersRoute;
