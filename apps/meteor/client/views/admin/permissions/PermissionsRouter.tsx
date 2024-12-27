import { useRouteParameter, usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import PermissionsTable from './PermissionsTable';
import UsersInRole from './UsersInRole';
import PageSkeleton from '../../../components/PageSkeleton';
import { useIsEnterprise } from '../../../hooks/useIsEnterprise';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const PermissionsRouter = (): ReactElement => {
	const canViewPermission = usePermission('access-permissions');
	const canViewSettingPermission = usePermission('access-setting-permissions');
	const context = useRouteParameter('context');
	const { data, isLoading } = useIsEnterprise();

	if (isLoading) {
		<PageSkeleton />;
	}

	if (!canViewPermission && !canViewSettingPermission) {
		return <NotAuthorizedPage />;
	}

	if (context === 'users-in-role') {
		return <UsersInRole />;
	}

	return <PermissionsTable isEnterprise={!!data?.isEnterprise} />;
};

export default PermissionsRouter;
