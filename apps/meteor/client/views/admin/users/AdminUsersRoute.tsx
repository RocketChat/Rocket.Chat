import { usePermission } from '@rocket.chat/ui-contexts';

import AdminUsersPage from './AdminUsersPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const AdminUsersRoute = () => {
	const canViewUserAdministration = usePermission('view-user-administration');

	if (!canViewUserAdministration) {
		return <NotAuthorizedPage />;
	}

	return <AdminUsersPage />;
};

export default AdminUsersRoute;
