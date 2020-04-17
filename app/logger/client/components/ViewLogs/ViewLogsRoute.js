import React from 'react';

import { NotAuthorizedPage } from '../../../../ui-admin/client/components/settings/NotAuthorizedPage';
import { usePermission } from '../../../../../client/contexts/AuthorizationContext';

import { ViewLogs } from '.';

export default function ViewLogsRoute() {
	const canViewLogs = usePermission('view-logs');
	return canViewLogs ? <ViewLogs/> : <NotAuthorizedPage/>;
}
