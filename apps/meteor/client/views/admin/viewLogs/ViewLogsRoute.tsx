import { usePermission } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import ViewLogsPage from './ViewLogsPage';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';

const ViewLogsRoute = (): ReactElement => {
	const canViewLogs = usePermission('view-logs');

	if (!canViewLogs) {
		return <NotAuthorizedPage />;
	}

	return <ViewLogsPage />;
};

export default ViewLogsRoute;
