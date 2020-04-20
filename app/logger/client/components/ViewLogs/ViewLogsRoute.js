import React from 'react';

import { NotAuthorizedPage } from '../../../../ui-admin/client/components/NotAuthorizedPage';
import { usePermission } from '../../../../../client/contexts/AuthorizationContext';

import { ViewLogs } from '.';

export default function ViewLogsRoute() {
	const canAccessMailer = usePermission('view-logs');

	if (!canAccessMailer) {
		return <NotAuthorizedPage />;
	}

	return <ViewLogs />;
}
