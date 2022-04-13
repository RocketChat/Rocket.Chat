import React, { ReactElement } from 'react';

import { usePermission } from '../../../contexts/AuthorizationContext';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import ViewLogsPage from './ViewLogsPage';

const ViewLogsRoute = (): ReactElement => {
	const canViewLogs = usePermission('view-logs');

	if (!canViewLogs) {
		return <NotAuthorizedPage />;
	}

	return <ViewLogsPage />;
};

export default ViewLogsRoute;
