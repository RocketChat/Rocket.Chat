import React from 'react';

import { usePermission } from '../../contexts/AuthorizationContext';
import NotAuthorizedPage from '../../components/NotAuthorizedPage';
import Managers from './Managers';

function ManagersRoute() {
	const canViewManagers = usePermission('manage-livechat-managers');

	if (!canViewManagers) {
		return <NotAuthorizedPage />;
	}

	return <Managers />;
}

export default ManagersRoute;
