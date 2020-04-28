import React from 'react';

import { NotAuthorizedPage } from '../../../../client/admin/NotAuthorizedPage';
import { usePermission } from '../../../../client/contexts/AuthorizationContext';
import ViewLogs from './ViewLogs';

export default function ViewLogsRoute() {
	const canViewLogs = usePermission('view-logs');

	if (!canViewLogs) {
		return <NotAuthorizedPage />;
	}

	return <ViewLogs />;
}
