import { NotAuthorizedPage } from '@rocket.chat/ui-client';
import { usePermission } from '@rocket.chat/ui-contexts';

import AdminUsersPage from './AdminUsersPage';

const AdminUsersRoute = () => {
	const canViewUserAdministration = usePermission('view-user-administration');

	if (!canViewUserAdministration) {
		return <NotAuthorizedPage />;
	}

	return <AdminUsersPage />;
};

export default AdminUsersRoute;
