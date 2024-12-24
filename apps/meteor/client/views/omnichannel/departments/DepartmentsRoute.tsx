import { usePermission } from '@rocket.chat/ui-contexts';

import DepartmentsPage from './DepartmentsPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const DepartmentsRoute = () => {
	const canViewDepartments = usePermission('manage-livechat-departments');

	if (!canViewDepartments) {
		return <NotAuthorizedPage />;
	}

	return <DepartmentsPage />;
};

export default DepartmentsRoute;
