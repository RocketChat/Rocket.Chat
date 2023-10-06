import { usePermission } from '@rocket.chat/ui-contexts';
import React from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import DepartmentsPage from './DepartmentsPage';

const DepartmentsRoute = () => {
	const canViewDepartments = usePermission('manage-livechat-departments');

	if (!canViewDepartments) {
		return <NotAuthorizedPage />;
	}

	return <DepartmentsPage />;
};

export default DepartmentsRoute;
