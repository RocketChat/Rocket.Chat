import React from 'react';

import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import { usePermission } from '../../../contexts/AuthorizationContext';
import { useRouteParameter } from '../../../contexts/RouterContext';
import PermissionsTable from './PermissionsTable';
import UsersInRole from './UsersInRolePageContainer';

const PermissionsRouter = () => {
	const canViewPermission = usePermission('access-permissions');
	const canViewSettingPermission = usePermission('access-setting-permissions');
	const context = useRouteParameter('context');

	if (!canViewPermission && !canViewSettingPermission) {
		return <NotAuthorizedPage />;
	}

	if (context === 'users-in-role') {
		return <UsersInRole />;
	}

	return <PermissionsTable />;
};

export default PermissionsRouter;
