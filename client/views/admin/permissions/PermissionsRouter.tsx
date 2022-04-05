import React, { ReactElement } from 'react';

import { usePermission } from '../../../contexts/AuthorizationContext';
import { useRouteParameter } from '../../../contexts/RouterContext';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import PermissionsTable from './PermissionsTable/PermissionsTable';
import UsersInRole from './UsersInRole';

const PermissionsRouter = (): ReactElement => {
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
