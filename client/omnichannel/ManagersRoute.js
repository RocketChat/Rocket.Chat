import React from 'react';

import { usePermission } from '../contexts/AuthorizationContext';
import NotAuthorizedPage from '../components/NotAuthorizedPage';
import ManageAgents from './agentManager/ManageAgents';

function ManagersRoute() {
	const canViewManagers = usePermission('manage-livechat-managers');

	if (!canViewManagers) {
		return <NotAuthorizedPage />;
	}

	return <ManageAgents type='manager' />;
}

export default ManagersRoute;
