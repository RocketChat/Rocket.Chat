import React from 'react';

import { usePermission } from '../contexts/AuthorizationContext';
import NotAuthorizedPage from '../components/NotAuthorizedPage';
import ManageAgents from './agentManager/ManageAgents';

function AgentsRoute() {
	const canViewManagers = usePermission('manage-livechat-agents');

	if (!canViewManagers) {
		return <NotAuthorizedPage />;
	}

	return <ManageAgents type='agent' />;
}

export default AgentsRoute;
