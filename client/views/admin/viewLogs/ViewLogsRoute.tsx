import React, { ReactElement } from 'react';

import NotAuthorizedPage from '../../../components/NotAuthorizedPage';
import { usePermission } from '../../../contexts/AuthorizationContext';
import ViewLogsPage from './ViewLogsPage';

const ViewLogsRoute = (): ReactElement => {
	const canViewLogs = usePermission('view-logs');

	if (!canViewLogs) {
		return <NotAuthorizedPage />;
	}

	return <ViewLogsPage />;
};

export default ViewLogsRoute;
