import { useRouteParameter, usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import PermissionsPage from './PermissionsPage';
import UsersInRole from './UsersInRole';
import PageSkeleton from '../../../components/PageSkeleton';
import { useWorkspacesInfo } from '../../../hooks/useWorkspacesInfo';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const PermissionsRouter = (): ReactElement => {
	const canViewPermission = usePermission('access-permissions');
	const canViewSettingPermission = usePermission('access-setting-permissions');
	const context = useRouteParameter('context');
	const { data: workspaceInfo, isLoading } = useWorkspacesInfo();

	if (isLoading) {
		<PageSkeleton />;
	}

	if (!canViewPermission && !canViewSettingPermission) {
		return <NotAuthorizedPage />;
	}

	if (context === 'users-in-role') {
		return <UsersInRole />;
	}

	return <PermissionsPage isEnterprise={!!workspaceInfo?.license.isEnterprise} />;
};

export default PermissionsRouter;
