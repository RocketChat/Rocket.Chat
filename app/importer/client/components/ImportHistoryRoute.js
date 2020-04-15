import React from 'react';

import { usePermission } from '../../../../client/contexts/AuthorizationContext';
import NotAuthorizedPage from '../../../ui-admin/client/components/NotAuthorizedPage';
import ImportHistoryPage from './ImportHistoryPage';

function ImportHistoryRoute() {
	const canRunImport = usePermission('run-import');

	if (!canRunImport) {
		return <NotAuthorizedPage />;
	}

	return <ImportHistoryPage />;
}

export default ImportHistoryRoute;
